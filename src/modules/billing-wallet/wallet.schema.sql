-- WALLETS TABLE
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'PKR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- TRANSACTIONS TABLE with IDEMPOTENCY
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'TRANSFER_IN', 'TRANSFER_OUT', 'COMMISSION')),
    reference TEXT,
    description TEXT,
    metadata JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, idempotency_key)
);

CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_wallets_tenant ON wallets(tenant_id);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY wallet_tenant_isolation ON wallets
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY transaction_tenant_isolation ON transactions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- IDEMPOTENCY FUNCTIONS
CREATE OR REPLACE FUNCTION credit_wallet_with_idempotency(
    p_wallet_id UUID,
    p_amount NUMERIC,
    p_idempotency_key TEXT,
    p_reference TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    wallet_id UUID,
    amount NUMERIC,
    type TEXT,
    tenant_id UUID
) AS $$
DECLARE
    v_tenant UUID;
    v_wallet UUID;
BEGIN
    -- Check if already processed (idempotency)
    IF EXISTS (
        SELECT 1 FROM transactions 
        WHERE idempotency_key = p_idempotency_key AND processed = TRUE
    ) THEN
        RETURN QUERY 
        SELECT t.id, t.wallet_id, t.amount, t.type, t.tenant_id
        FROM transactions t WHERE t.idempotency_key = p_idempotency_key;
        RETURN;
    END IF;

    -- Get tenant from wallet
    SELECT tenant_id INTO v_tenant FROM wallets WHERE id = p_wallet_id;
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    -- Create transaction
    INSERT INTO transactions (
        tenant_id, wallet_id, amount, type, idempotency_key, reference, processed
    ) VALUES (
        v_tenant, p_wallet_id, p_amount, 'CREDIT', p_idempotency_key, p_reference, TRUE
    ) RETURNING id, wallet_id, amount, type, tenant_id INTO v_wallet;

    -- Credit wallet
    UPDATE wallets SET balance = balance + p_amount 
    WHERE id = p_wallet_id;

    RETURN QUERY SELECT * FROM v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION debit_wallet_with_idempotency(
    p_wallet_id UUID,
    p_amount NUMERIC,
    p_idempotency_key TEXT,
    p_reference TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    wallet_id UUID,
    amount NUMERIC,
    type TEXT,
    tenant_id UUID
) AS $$
DECLARE
    v_tenant UUID;
    v_balance NUMERIC;
BEGIN
    -- Check if already processed
    IF EXISTS (
        SELECT 1 FROM transactions 
        WHERE idempotency_key = p_idempotency_key AND processed = TRUE
    ) THEN
        RETURN QUERY 
        SELECT t.id, t.wallet_id, t.amount, t.type, t.tenant_id
        FROM transactions t WHERE t.idempotency_key = p_idempotency_key;
        RETURN;
    END IF;

    -- Get tenant and check balance
    SELECT tenant_id, balance INTO v_tenant, v_balance 
    FROM wallets WHERE id = p_wallet_id FOR UPDATE;

    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Create transaction
    INSERT INTO transactions (
        tenant_id, wallet_id, amount, type, idempotency_key, reference, processed
    ) VALUES (
        v_tenant, p_wallet_id, p_amount, 'DEBIT', p_idempotency_key, p_reference, TRUE
    ) RETURNING id, wallet_id, amount, type, tenant_id;

    -- Debit wallet
    UPDATE wallets SET balance = balance - p_amount 
    WHERE id = p_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION transfer_credits(
    p_from_wallet UUID,
    p_to_wallet UUID,
    p_amount NUMERIC,
    p_idempotency_key TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Debit from source
    PERFORM * FROM debit_wallet_with_idempotency(p_from_wallet, p_amount, p_idempotency_key || '-debit');
    
    -- Credit to destination
    PERFORM * FROM credit_wallet_with_idempotency(p_to_wallet, p_amount, p_idempotency_key || '-credit', 'Credit Transfer');
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
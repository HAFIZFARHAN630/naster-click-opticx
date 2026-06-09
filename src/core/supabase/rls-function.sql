-- PostgreSQL function to set tenant context for RLS
CREATE OR REPLACE FUNCTION set_tenant_context(
    p_tenant_id UUID,
    p_branch_id UUID DEFAULT NULL,
    p_user_role TEXT DEFAULT 'USER'
)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, false);
    PERFORM set_config('app.current_branch_id', COALESCE(p_branch_id, '')::TEXT, false);
    PERFORM set_config('app.current_user_role', p_user_role, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION set_tenant_context TO authenticated;
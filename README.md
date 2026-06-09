# ISP Management Suite - Phase 1

## Setup

```bash
npm install
```

## Supabase Setup

1. Create Supabase project at supabase.com
2. Run `src/core/supabase/schema.sql` in SQL editor
3. Run `src/core/supabase/rls-function.sql` to create tenant context function
4. Enable RLS on tables
5. Configure `.env` with Supabase credentials

## Redis Setup

```bash
# Install Redis locally
# Or use Redis Cloud
```

## Validation

- RLS prevents cross-tenant data access
- Hardware passwords encrypted before storage
- Role hierarchy enforced via guards
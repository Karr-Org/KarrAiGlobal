---
description: How to maintain and deploy Supabase database migrations
---

# Supabase Migration Workflow

When modifying the database schema or deploying migrations, follow these steps to ensure reliability and idempotency.

## 1. Creating Migrations (Idempotency is Key)

Migrations should be written so they can be run multiple times without failure. This is critical for `supabase db push` to work reliably, especially when previous attempts have failed or partial state exists.

### Rules for Idempotency

1. **Tables & Types:** Always use `IF NOT EXISTS`.

    ```sql
    CREATE TABLE IF NOT EXISTS my_table (...);
    DO $$ BEGIN
        CREATE TYPE my_enum AS ENUM ('value1', 'value2');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    ```

2. **Indexes:** use `IF NOT EXISTS`.

    ```sql
    CREATE INDEX IF NOT EXISTS idx_my_table_col ON my_table(col);
    ```

3. **Columns:** Use `ADD COLUMN IF NOT EXISTS`.

    ```sql
    ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_col TEXT;
    ```

4. **Policies (RLS):** Policies do **NOT** support `IF NOT EXISTS`. You **MUST** drop them before creating them.

    ```sql
    DROP POLICY IF EXISTS "Policy Name" ON table_name;
    CREATE POLICY "Policy Name" ON table_name ...;
    ```

    *Failure to do this is the #1 cause of migration failures.*

5. **Triggers:** Triggers also require explicit dropping.

    ```sql
    DROP TRIGGER IF EXISTS trigger_name ON table_name;
    CREATE TRIGGER trigger_name ...;
    ```

6. **Functions:** `CREATE OR REPLACE FUNCTION` is naturally idempotent, but ensure the signature matches.

## 2. Deploying Migrations

To deploy migrations to the remote database:

```bash
npx supabase db push
```

If you encounter `already exists` errors, it means a migration script is not idempotent.

1. Read the error log to identify the specific object (policy, trigger, constraint).
2. Modify the *existing* migration file to add the necessary `DROP IF EXISTS` or `IF NOT EXISTS` check.
3. Re-run `db push`.

**Do not delete migration files** once they have been pushed or shared, as this can corrupt the migration history. Fix forward by editing the file or adding a new migration that handles the state gracefully.

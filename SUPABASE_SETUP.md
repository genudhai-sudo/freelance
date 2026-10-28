# Legacy Supabase setup

The frontend now uses the local Node.js and SQLite API described in [`LOCAL_API.md`](LOCAL_API.md). It does not read Supabase credentials or connect to Supabase.

The SQL in [`supabase/profiles.sql`](supabase/profiles.sql) is only for the separate Supabase project and is not used by the local SQLite API. The local API creates its own SQLite schema automatically in `data/kiptalent.sqlite`.

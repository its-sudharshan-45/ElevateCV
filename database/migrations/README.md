# Database migrations

UpSkilr uses sequential, numbered SQL migrations applied in order.

## Conventions

- File naming: `NNN_description.sql` (zero-padded, snake_case)
- One logical change per migration
- Migrations must be idempotent where practical (`IF NOT EXISTS`)
- Never edit applied migrations; add a new migration instead
- Include RLS policies with user-owned tables
- Document breaking changes in `docs/`

## Apply locally (Supabase SQL editor or psql)

```bash
psql "$DATABASE_URL" -f database/migrations/001_enable_extensions.sql
psql "$DATABASE_URL" -f database/migrations/002_identity_profiles.sql
psql "$DATABASE_URL" -f database/migrations/003_resume_intelligence.sql
```

## Rollback

Forward-only migrations for MVP. Document manual rollback steps in migration headers when needed.

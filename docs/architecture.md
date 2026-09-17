# Architecture

## Overview

UpSkilr is a monorepo with a Next.js frontend and Express REST API backed by Supabase PostgreSQL.

```text
frontend (Next.js) ──REST──> backend (Express) ──> Supabase (Auth + PostgreSQL)
```

## Backend layers

```text
Routes → Controllers → Services → Repositories → Database
```

- Controllers: HTTP request/response mapping only
- Services: business rules and orchestration
- Repositories: data access

## API conventions

- Base path: `/api/v1`
- JSON request/response bodies
- Structured errors: `{ error: { code, message, details?, requestId? } }`
- Request correlation via `x-request-id` header

## Authentication

- Supabase Auth issues JWT access tokens
- Frontend stores session via `@supabase/ssr`
- Backend validates tokens with Supabase Admin `getUser`
- Authorization uses authenticated user ID; never trust client-provided `userId`

## Environment variables

See root `.env.example`. Frontend variables require `NEXT_PUBLIC_` prefix.

Backend resume storage:

- `RESUME_STORAGE_BUCKET` — private Supabase Storage bucket name (default: `resumes`)
- `RESUME_MAX_FILE_SIZE_BYTES` — maximum upload size in bytes (default: 5242880)

## Resume API (Phase 2)

Authenticated endpoints:

```text
POST   /api/v1/resumes              multipart upload
GET    /api/v1/resumes              list own resumes (metadata only)
GET    /api/v1/resumes/:id           resume detail + analysis
POST   /api/v1/resumes/:id/process  extract, parse, analyze
DELETE /api/v1/resumes/:id          delete record + storage object
```

Resume files are stored in private Supabase Storage. Processing uses deterministic section parsing and scoring (no LLM).

## Job API (Phase 3)

Authenticated endpoints:

```text
POST   /api/v1/jobs
GET    /api/v1/jobs
GET    /api/v1/jobs/:id
POST   /api/v1/jobs/:id/match   body: { resumeId }
DELETE /api/v1/jobs/:id
```

Job requirement extraction and resume-to-job matching use deterministic rules. Match score weights: required skills 70%, preferred skills 20%, section alignment 10%.

# Talvo Backend API

Express + TypeScript backend for recruiter onboarding, job intake, applicant ingestion, screening runs, and Gemini-powered recruiter assistance.

## What’s in this backend

- Cookie-based auth with CSRF protection
- Recruiter onboarding and Google OAuth
- Job creation and dashboard data
- Applicant import from JSON arrays or CSV/XLSX uploads
- Resume ZIP upload with PDF text extraction and optional Gemini enrichment
- Deterministic screening runs plus Gemini-based screening endpoints
- Recruiter assistant conversations
- Final review and candidate outcome emails

## Runtime notes

- Base server routes are mounted from [src/server.ts](/home/nezn/Debug/Talent-Screen/backend/src/server.ts)
- Interactive docs are served at `/docs`
- The raw OpenAPI document is served at `/openapi.json`
- Protected routes use the `access_token` cookie, not a bearer token
- Mutating routes also require a CSRF token via the `X-CSRF-Token` header
- Protected data routes are scoped to the authenticated user's own workspace records only
- For local testing only, protected routes accept `X-Dev-Auth: true` to bypass cookie auth

## Current route map

### Auth routes

Mounted at `/auth`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/auth/csrf` | Issues and returns a CSRF token |
| POST | `/auth/signup` | Create account |
| POST | `/auth/confirm` | Confirm signup with 6-digit OTP |
| GET | `/auth/confirm_link/:confirmation_link_id` | Confirm signup from emailed link |
| POST | `/auth/login` | Login |
| GET | `/auth/google/start` | Start Google OAuth |
| GET | `/auth/google/callback` | Finish Google OAuth and redirect to frontend |
| POST | `/auth/forgot` | Generate password reset OTP |
| POST | `/auth/verify` | Verify password reset OTP |
| POST | `/auth/reset` | Reset password |
| POST | `/auth/logout` | Clear auth/session cookies |
| POST | `/auth/onboarding` | Complete recruiter onboarding |
| GET | `/auth/me` | Current signed-in user |

### Dashboard and intake routes

Mounted at `/`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/dashboard` | Jobs, applicants, stats, and pagination |
| GET | `/jobs` | Paginated jobs |
| GET | `/jobs/:id` | Single job |
| GET | `/candidates` | Paginated candidates |
| GET | `/candidates/:id` | Single candidate |
| POST | `/complete-job` | Create a job |
| POST | `/register-candidates` | Import applicants from JSON or spreadsheet |
| POST | `/resume` | Upload ZIP of PDF resumes |
| POST | `/ask` | Run deterministic screening flow |
| POST | `/review-result` | Save recruiter shortlist/reject decisions in bulk |
| POST | `/sendEmails` | Send shortlisted/rejected outcome emails |

### AI routes

Mounted at `/ai`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/ai/models` | List Gemini models using `GOOGLE_API_KEY` |
| POST | `/ai/run` | Run screening via controller flow |
| GET | `/ai/runs` | Paginated screening runs |
| GET | `/ai/runs/:runId` | Run details plus paginated results |
| GET | `/ai/jobs/:jobId/results` | Latest run results for a job |
| POST | `/ai/jobs/:jobId/finalize` | Final recruiter decisions plus email processing |
| POST | `/ai/results/:resultId/review` | Re-review a `Review` bucket result with Gemini |
| POST | `/ai/ask` | Recruiter assistant with optional job context |
| GET | `/ai/context/:jobId` | Raw job + candidate context |

### AI assistant sub-routes

Mounted at `/ai/assistant`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/ai/assistant/conversations` | Conversation history for current user |
| POST | `/ai/assistant/ask` | Ask assistant and persist/update conversation |

### AI screening sub-routes

Mounted at `/ai/screening`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/ai/screening/models` | List Gemini models |
| POST | `/ai/screening/run` | Direct Gemini screening run |
| GET | `/ai/screening/runs` | Screening runs list |
| GET | `/ai/screening/runs/:runId/results` | Results for a run |
| GET | `/ai/screening/jobs/:jobId/results` | Latest results for a job |

## Request shapes

### CSRF

1. Call `GET /auth/csrf`
2. Read the returned `csrfToken`
3. Send it back in `X-CSRF-Token` on `POST` requests

The backend also sets a `csrf_token` cookie. The header and cookie must match.

### Signup and login

`/auth/signup`, `/auth/login`, `/auth/forgot`, `/auth/reset`, and `/auth/onboarding` accept either:

- A plain JSON body
- A wrapped body under `reqBody`

Example:

```json
{
  "reqBody": {
    "user_email": "jane@acme.com",
    "user_pass": "Secure@123"
  }
}
```

Password fields must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.

### Create job

`POST /complete-job`

Required fields:

- `job_title`
- `job_department`
- `job_location`
- `job_employment_type`
- `job_description`

Common optional fields:

- `job_experience_required`
- `job_responsibilities`
- `job_qualifications`
- `job_ai_criteria`
- `job_shortlist_size`
- `job_state`
- `job_salary_min`
- `job_salary_max`
- `workers_required`
- `minimum_marks`

### Register candidates

`POST /register-candidates`

Accepted modes:

- `multipart/form-data` with a spreadsheet file in `file` or `applicants_spreadsheet`
- Raw JSON array of applicants

Optional body fields:

- `default_job_id`
- `default_job_title`
- `job_id`
- `job_title`

Accepted spreadsheet formats:

- `.csv`
- `.xlsx`

Imports are deduplicated per authenticated user workspace, not across all users globally.

### Upload resumes

`POST /resume`

Use `multipart/form-data` with a ZIP file in `file` or `resume_pdf_zip`.

Optional job matching context:

- `default_job_id`
- `default_job_title`
- `job_id`
- `job_title`

The ZIP must contain PDF files. The backend matches files to applicants, stores extracted text, and optionally enriches applicant fields with Gemini.
Resume matching and updates are limited to applicants owned by the authenticated user.

### Run screening

Deterministic controller route:

```json
{
  "jobId": "job_id_here"
}
```

Also accepts `job_id`, `jobTitle`, or `job_title`.

Direct Gemini screening route:

```json
{
  "jobId": "job_id_here",
  "applicantIds": ["applicant_id_1", "applicant_id_2"],
  "topK": 10
}
```

### Save manual review results

`POST /review-result`

```json
{
  "verdict_string": [
    {
      "applicant_id": "applicant_id_here",
      "applicant_name": "Jane Doe",
      "job_title": "Frontend Engineer",
      "shortlisted": true
    }
  ]
}
```

`verdict_string` may be sent as an array or as a JSON stringified array.

### Finalize recruiter decisions

`POST /ai/jobs/:jobId/finalize`

```json
{
  "decisions": [
    {
      "result_id": "result_id_here",
      "applicant_id": "applicant_id_here",
      "verdict": "Shortlisted"
    }
  ]
}
```

Valid verdicts:

- `Shortlisted`
- `Rejected`

### Re-review a result with Gemini

`POST /ai/results/:resultId/review`

```json
{
  "additional_info": "Candidate completed a take-home assignment with strong results."
}
```

This only works for results currently in the `Review` bucket.

### Assistant

Simple assistant route:

```json
{
  "job_id": "optional_job_id",
  "question": "Who is the strongest backend candidate?"
}
```

Conversation route:

```json
{
  "conversationId": "optional_existing_conversation_id",
  "jobId": "optional_job_id",
  "applicantIds": ["optional_applicant_id"],
  "maxApplicants": 50,
  "question": "Summarize the top candidates for this role."
}
```

## Response patterns

Most successful responses return one of:

- `{ "success": "..." }`
- `{ "user": { ... } }`
- `{ "job": { ... } }`
- `{ "jobs": [...], "pagination": { ... } }`
- `{ "candidates": [...], "pagination": { ... } }`
- `{ "run": { ... }, "results": [...], "pagination": { ... } }`

Most error responses return one of:

- `input_error`
- `data_error`
- `auth_error`
- `user_error`
- `expired_error` or `expiration_error`
- `server_error`

## Environment variables

Configured in [src/config/env.ts](/home/nezn/Debug/Talent-Screen/backend/src/config/env.ts).

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port, defaults to `10000` |
| `MONGO_URI` | MongoDB connection string |
| `ACCESS_SECRET` | JWT signing secret used for auth cookies |
| `REFRESH_SECRET` | Present in config but not used by current route flow |
| `FRONTEND_ORIGIN` | Allowed CORS origin |
| `FRONTEND_URL` | Frontend redirect target |
| `API_URL` / `BACKEND_URL` / `RENDER_EXTERNAL_URL` | Backend origin for OAuth callback generation |
| `GOOGLE_CLIENT_ID` / `CLIENT_ID` | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` / `CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_API_KEY` | Gemini API key |
| `GOOGLE_AI_MODEL` | Gemini model override |
| `VERTEX_PROJECT_ID` | Vertex AI project |
| `VERTEX_LOCATION` | Vertex AI region |
| `CLOUDINARY_API_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret |
| `USER_EMAIL` / `USER_PASS` | Legacy SMTP sender config |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port |
| `SMTP_SECURE` | SMTP TLS flag |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | SMTP from address |
| `AUTO_SEED` | Seed demo data on startup when `true` |

## Local run

```bash
npm install
npm run build
npm start
```

`npm run dev` currently watches `dist/server.js`, so it relies on compiled output being present.

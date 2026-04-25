#Talvo  — AI-Powered Recruiter Screening Platform

> A backend API that helps recruiters screen, rank, and shortlist candidates using a hybrid AI engine powered by Google Gemini, with a deterministic fallback scoring layer for full transparency and explainability.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [AI Decision Flow](#ai-decision-flow)
- [Assumptions & Limitations](#assumptions--limitations)

---

## Project Overview

Talvo is a Node.js/TypeScript REST API backend for AI-assisted recruitment workflows. Recruiters can:

- **Create job listings** with structured AI scoring criteria (must-haves vs. nice-to-haves)
- **Ingest candidates** via CSV/XLSX spreadsheet upload or bulk resume ZIP (PDF extraction)
- **Run AI screening** — candidates are ranked and shortlisted by Gemini (Google's LLM) with fallback to a deterministic scoring engine
- **Chat with an AI recruiter assistant** — ask natural-language questions about candidates and get back structured answers with suggested follow-up questions
- **Review and act on results** — recruiters can approve/reject shortlisted candidates and trigger notification emails

The system is intentionally designed to **augment human decision-making**, not replace it. All AI outputs carry transparency signals: matched skills, gaps, grade letters (A–D), percentile ranks, and flag warnings (career gaps, overqualification, incomplete profiles).

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Express Server                        │
│                     (server.ts)                           │
└───────────┬──────────────┬──────────────┬────────────────┘
            │              │              │
     /auth  │       /       │    /ai       │
            ▼              ▼              ▼
     ┌──────────┐  ┌──────────────┐  ┌──────────────────┐
     │  Auth    │  │  Dashboard   │  │   AI Service     │
     │  Routes  │  │  Routes      │  │   Routes         │
     └──────────┘  └──────┬───────┘  └────────┬─────────┘
                          │                   │
              ┌───────────┼───────────┐       │
              ▼           ▼           ▼       ▼
        ┌──────────┐ ┌────────┐ ┌─────────────────────┐
        │ Intake   │ │ Jobs   │ │  Screening Service  │
        │ API      │ │ API    │ │  + Assistant Router │
        │(CSV/ZIP) │ │        │ └──────────┬──────────┘
        └──────────┘ └────────┘            │
                                    ┌──────┴───────┐
                                    ▼              ▼
                             ┌────────────┐  ┌──────────────┐
                             │  Gemini    │  │Deterministic │
                             │  LLM Layer │  │  Scorer      │
                             │(AI Studio  │  │(screeningService│
                             │ /Vertex)   │  │  .ts)        │
                             └─────┬──────┘  └──────┬───────┘
                                   └────────┬────────┘
                                            ▼
                                   ┌─────────────────┐
                                   │    MongoDB       │
                                   │  (Mongoose ODM)  │
                                   │                  │
                                   │ • Applicant      │
                                   │ • Job            │
                                   │ • ScreeningRun   │
                                   │ • ScreenResult   │
                                   │ • Resume         │
                                   │ • User           │
                                   └─────────────────┘
```

### Key Modules

| Path | Responsibility |
|---|---|
| `src/server.ts` | Express app bootstrap, middleware, CORS, route mounting |
| `src/config/env.ts` | Centralised environment variable access |
| `src/config/db.ts` | MongoDB connection via Mongoose |
| `src/lib/gemini.ts` | All Gemini LLM integrations (screening, assistant, resume parsing, narrative enrichment) |
| `src/services/screeningService.ts` | Deterministic multi-dimensional candidate scorer |
| `src/services/aiservice.ts` | AI route aggregator — mounts `/ai/screening` and `/ai/assistant` sub-routers |
| `src/controllers/intakeApi.ts` | CSV/XLSX spreadsheet ingestion + resume ZIP parsing |
| `src/controllers/screeningApi.ts` | Screening run orchestration, result review, email dispatch |
| `src/routes/screening.ts` | REST endpoints for Gemini-powered screening runs |
| `src/routes/assistant.ts` | REST endpoint for Gemini recruiter Q&A assistant |
| `src/models/` | Mongoose schemas: Applicant, Job, ScreeningRun, ScreenResult, Resume, User |
| `src/utils/talentProfile.ts` | Normalisation utilities for skills, experience, education, etc. |
| `src/lib/emailTemplates.ts` | HTML email templates for candidate notifications |

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB instance (local or Atlas)
- Google Cloud project with Gemini API access (AI Studio key **or** Vertex AI credentials)
- Cloudinary account (for resume/file storage)
- SMTP credentials (for notification emails)

### 1. Clone & Install

```bash
git clone <repo-url>
cd <repo-folder>
npm install
```

### 2. Configure Environment

Copy the example below into a `.env` file at the project root and fill in your values (see [Environment Variables](#environment-variables)).

```bash
cp .env.example .env
# then edit .env with your credentials
```

### 3. Build

```bash
npm run build
```

### 4. Seed Demo Data (Optional)

Set `AUTO_SEED=true` in `.env` **or** run the seed script manually:

```bash
npm run seed
```

This populates demo jobs and candidates so you can test screening immediately.

### 5. Start the Server

```bash
# Production
npm start

# Development (with ts-node / watch mode)
npm run dev
```

The server listens on `PORT` (default `10000`).

### 6. Explore the API Docs

An auto-generated API reference (Scalar) is served at:

```
http://localhost:10000/docs
```

The raw OpenAPI spec is available at `/openapi.json`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: `10000`) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `ACCESS_SECRET` | **Yes** | JWT access token signing secret |
| `REFRESH_SECRET` | **Yes** | JWT refresh token signing secret |
| `FRONTEND_ORIGIN` | No | Allowed CORS origin for the frontend (default: `http://localhost:3000`) |
| `GOOGLE_API_KEY` | Yes* | Google AI Studio API key for Gemini |
| `GOOGLE_AI_MODEL` | No | Gemini model name to use (default: `gemini-1.5-flash`) |
| `VERTEX_PROJECT_ID` | Yes* | Google Cloud project ID for Vertex AI |
| `VERTEX_LOCATION` | Yes* | Vertex AI region (e.g. `us-central1`) |
| `CLOUDINARY_API_NAME` | **Yes** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret |
| `USER_EMAIL` | **Yes** | SMTP sender email address |
| `USER_PASS` | **Yes** | SMTP sender password |
| `AUTO_SEED` | No | Set to `true` to auto-seed demo data on startup |

> *Either `GOOGLE_API_KEY` **or** both `VERTEX_PROJECT_ID` + `VERTEX_LOCATION` must be set for AI features to work. If neither is configured, the deterministic scorer runs without LLM enrichment.

### Example `.env`

```env
PORT=10000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/wiserank
ACCESS_SECRET=your_access_jwt_secret
REFRESH_SECRET=your_refresh_jwt_secret

FRONTEND_ORIGIN=http://localhost:3000

# Pick ONE of the Gemini auth strategies:
GOOGLE_API_KEY=AIza...                  # AI Studio (simplest)
# VERTEX_PROJECT_ID=my-gcp-project      # Vertex AI alternative
# VERTEX_LOCATION=us-central1

GOOGLE_AI_MODEL=gemini-1.5-flash

CLOUDINARY_API_NAME=my_cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123secret

USER_EMAIL=noreply@example.com
USER_PASS=smtp_password

AUTO_SEED=false
```

---

## API Reference

### Authentication — `/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register a new recruiter account |
| POST | `/auth/login` | Login and receive JWT access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout and invalidate tokens |

All protected routes require a valid JWT in the `Authorization: Bearer <token>` header (or cookie).

### Dashboard — `/`

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Overview stats (jobs, candidates, runs) |
| GET | `/jobs` | List all jobs |
| GET | `/jobs/:id` | Get a single job |
| POST | `/complete-job` | Create a new job with AI criteria |
| GET | `/candidates` | List all candidates |
| GET | `/candidates/:id` | Get a single candidate profile |
| POST | `/register-candidates` | Upload CSV/XLSX to bulk-register candidates |
| POST | `/resume` | Upload a ZIP of resume PDFs |
| POST | `/ask` | Trigger a screening run for a job |
| POST | `/review-result` | Recruiter approves/rejects a screening result |
| POST | `/sendEmails` | Dispatch notification emails to shortlisted candidates |

### AI — `/ai`

| Method | Path | Description |
|---|---|---|
| GET | `/ai/models` | List available Gemini models |
| POST | `/ai/run` | Run AI screening (Gemini) for a job |
| GET | `/ai/runs` | List all screening runs |
| GET | `/ai/runs/:runId` | Get a specific screening run |
| GET | `/ai/jobs/:jobId/results` | Latest screening results for a job |
| POST | `/ai/ask` | Ask the recruiter AI assistant a question |
| POST | `/ai/assistant/ask` | Recruiter assistant (extended context) |
| POST | `/ai/screening/run` | Gemini screening sub-router |
| GET | `/ai/context/:jobId` | Get job + candidate context for AI |

---

## AI Decision Flow

Talvo uses a **two-layer hybrid approach** to ensure accuracy, transparency, and graceful degradation:

```
Recruiter triggers screening for a job
             │
             ▼
1. CANDIDATE FETCH
   Query MongoDB for all applicants matching the job
   (by job_id or job_title)
             │
             ▼
2. DETERMINISTIC SCORING  (screeningService.ts)
   Each candidate is scored across 7 weighted dimensions:

   ┌─────────────────────────────┬────────┐
   │ Dimension                   │ Weight │
   ├─────────────────────────────┼────────┤
   │ Skills match                │  30%   │
   │ Experience relevance        │  25%   │
   │ Project quality             │  15%   │
   │ Education fit               │  10%   │
   │ Certifications value        │  10%   │
   │ Language fit                │   5%   │
   │ Availability fit            │   5%   │
   └─────────────────────────────┴────────┘

   • Skills: fuzzy-matches candidate evidence pool
     (skills, tech stack, resume text, bio) against
     job's must-have (high priority) and nice-to-have criteria
   • Experience: inferred years vs. required years
   • Education: degree level + field relevance heuristics
   • Flags detected: career gaps >12 months, overqualification,
     location mismatch, incomplete profile
             │
             ▼
3. RANKING & SHORTLISTING
   Candidates sorted by composite score descending.
   Top-K are marked "Shortlisted"; others "Review" or "Rejected".
             │
             ▼
4. GEMINI LLM ENRICHMENT  (gemini.ts — enrichScreeningNarratives)
   The top-K shortlist is sent to Gemini with job context.
   Gemini returns per-candidate:
   • A human-readable recruiter summary paragraph
   • Concise strengths list
   • Concise gaps list
   • A recruiter-friendly recommendation string
   These narratives replace the deterministic summaries for the shortlist.
   If Gemini is unavailable, deterministic summaries are preserved.
             │
             ▼
5. RESULT PERSISTENCE
   ScreeningRun and ScreenResult records saved to MongoDB.
   Results returned to the recruiter with rank, percentile,
   grade (A/B/C/D), match score, and full dimension breakdown.
             │
             ▼
6. RECRUITER REVIEW
   Human recruiter reviews shortlist, approves or rejects,
   and optionally dispatches notification emails to candidates.
```

### Gemini Screening Mode (Alternative Flow)

When called via `/ai/screening/run`, the screening runs **entirely inside Gemini** (no deterministic pre-scoring). Gemini receives the full job spec and all candidate profiles and returns a ranked shortlist directly. Results are converted to the same ScreenResult schema and stored identically.

### Recruiter Assistant

```
Recruiter asks a natural-language question
             │
             ▼
Job + candidate context fetched from MongoDB
             │
             ▼
Question + context sent to Gemini as a structured prompt
             │
             ▼
Gemini returns:
  • answer  — a concise, recruiter-friendly response
  • suggestedNextQuestions  — up to 5 follow-up questions
             │
             ▼
Response returned to recruiter
```

### Resume Parsing (Intake Flow)

```
ZIP of PDF resumes uploaded
       │
       ▼
PDFs extracted, text parsed per file
       │
       ▼
Gemini parses resume text → structured profile fields:
  skills, experience, education, certifications,
  projects, languages, availability, social_links
       │
       ▼
Parsed fields merged into Applicant record in MongoDB
```

---

## Assumptions & Limitations

### Assumptions

- **Single-tenant**: The system is built for one recruiter organisation per deployment. All authenticated users share the same job and candidate data.
- **English-first**: Screening prompts, scoring heuristics, and email templates are written in English. Non-English resumes may yield degraded parsing quality.
- **Gemini availability**: AI enrichment and the recruiter assistant require a live Google API connection. The deterministic scorer functions independently if Gemini is unreachable.
- **Candidate–job linking**: Candidates are associated with jobs either via an explicit `job_id` field or a matching `job_title` string. Titles must be consistent for matching to work correctly.
- **Resume quality**: Gemini resume parsing quality depends on the clarity and structure of the source PDF. Scanned or image-only PDFs will yield poor extraction.
- **Spreadsheet format**: Bulk candidate upload expects a specific column schema in the CSV/XLSX (validated via the intake controller). Non-conforming files will be rejected.

### Limitations

- **Shortlist cap**: The Gemini screening route enforces `topK ≤ 50` and loads at most 500 applicants per run due to LLM context window constraints.
- **No real-time streaming**: Screening results are returned synchronously after the full Gemini call completes (up to 60 second timeout per request).
- **Model fallback only on 404**: The Gemini client falls back through a list of model aliases only when a `404 / model not found` error is returned. Other errors are not retried.
- **No multi-round conversations**: The recruiter assistant is stateless — each `/ai/ask` call is independent. Conversation history is not maintained across requests.
- **Email delivery**: Notification emails use a single SMTP account. No bounce handling, unsubscribe mechanism, or delivery tracking is implemented.
- **No role-based access control**: Any authenticated user has full read/write access. Recruiter role differentiation is not implemented.
- **Vertex AI untested in CI**: Vertex AI auth is implemented but the primary tested path is Google AI Studio (`GOOGLE_API_KEY`).
- **Seed data is additive**: `AUTO_SEED` checks for existing records but does not enforce idempotency on all fields — running seed multiple times on a populated database may produce duplicates.
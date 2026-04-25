# Talvo (Frontend)

Production-ready frontend for **WiseRank** — an AI-powered candidate screening tool for HR recruiters.

## Tech stack (strict)

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Redux Toolkit**
- **Axios**
- **Framer Motion**
- **Recharts**
- **Lucide React**
- **React Hot Toast**
- **React Dropzone**

## Design system tokens

Tailwind tokens are defined in `tailwind.config.ts` and mapped to:

- **primary**: `#0F172A`
- **accent**: `#3B82F6` (hover: `#2563EB`)
- **success/warning/danger**: `#10B981` / `#F59E0B` / `#EF4444`
- **bg/card/border**: `#F8FAFC` / `#FFFFFF` / `#E2E8F0`
- **text-primary/text-muted**: `#0F172A` / `#64748B`

Typography uses **Inter** via `next/font`.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — you’ll land on the **marketing homepage**. Use **Get started** / **Sign in** for the auth screens (demo: no real backend; forms redirect into the app).

## Environment variables

All API calls go through `src/lib/api.ts` (Axios) and use:

- `NEXT_PUBLIC_API_URL`
  - If omitted, the app runs in **mock mode** (`mock://local`) with realistic local dummy data.

## API Documentation

The app interacts with the following endpoints:

- `GET /dashboard/stats` - Dashboard statistics
- `GET /jobs` - List all jobs
- `GET /jobs/:id` - Get job details
- `GET /candidates` - List all candidates
- `GET /candidates/:id` - Get candidate details
- `GET /screening/results?jobId=:id` - Screening results for a job

All endpoints return JSON data. In mock mode, responses are simulated with delays.





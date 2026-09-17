# ElevateCV (UpSkilr)

> **AI-Powered Resume Intelligence & Job-Match Optimization Platform**

ElevateCV is an end-to-end career intelligence platform that bridges the gap between candidate resumes and modern Applicant Tracking Systems (ATS). By combining structured PDF parsing, Named Entity Recognition (NER), and multi-provider AI reasoning, ElevateCV analyzes resumes against target job descriptions, pinpoints critical skill and keyword gaps, and helps candidates iterate toward high-impact, tailored applications.

---

## 🚀 Key Capabilities

* **Intelligent Document Extraction:** High-fidelity PDF parsing and Named Entity Recognition (NER) to convert unstructured resumes into structured, queryable data.
* **Target Job Description Matching:** Real-time ATS readiness scoring across skills, experience alignment, and keyword density.
* **Deep Gap Analysis:** Actionable reports highlighting missing competencies, impact-driven bullet point suggestions, and phrasing enhancements.
* **Iterative AI Optimization:** Interactive accept/reject workflow for AI recommendations with automated version tracking and comparison.
* **Production-Ready Artifacts:** High-quality resume preview with one-click export to ATS-friendly PDF and DOCX formats.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Radix UI, Framer Motion
* **Backend:** Node.js, Express, TypeScript, Zod, Vitest
* **Database & Auth:** PostgreSQL (Supabase), pgvector
* **AI Runtime:** Multi-provider LLM orchestration (Groq, Anthropic, OpenAI) with schema validation and fallback handling

---

## 📁 Project Structure

```text
ElevateCV/
├── frontend/         # React 19 + Vite application
│   ├── src/
│   │   ├── features/ # Feature modules (resume, auth, profile, notification)
│   │   └── components/
│   └── package.json
├── backend/          # Express REST API
│   ├── src/
│   │   ├── ai/       # AI adapters, normalizers, inference engine
│   │   ├── modules/  # Resume, profile, notification modules
│   │   └── config/   # Environment and Supabase client configs
│   └── package.json
├── database/         # PostgreSQL migrations & documentation
└── docs/             # Architecture and implementation notes
```

---

## 🚦 Getting Started

### 1. Configure Environment Variables

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Fill in your Supabase project credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and optional AI provider API keys (`GROQ_API_KEY`, etc.).

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Servers

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately:
npm run dev:backend   # API server on http://localhost:4000
npm run dev:frontend  # Web client on http://localhost:5173
```

---

## 🧪 Quality & Verification Suite

```bash
# Run TypeScript compilation check
npm run typecheck

# Run ESLint across all workspaces
npm run lint

# Run Vitest test suites (Unit & Integration)
npm run test

# Run production build
npm run build
```

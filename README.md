# CareerPulse AI

A resume-analysis and sample job-matching MVP built with FastAPI, React, and Vite.

## Features

- Upload PDF, DOCX, or TXT resumes (maximum 5 MB).
- Review a heuristic resume score, detected sections, skills, and improvement suggestions.
- Compare detected skills with a small set of illustrative job profiles.
- Drag and drop or browse to select a resume.
- Uploaded content is processed in memory for the request and is not saved by this MVP.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Optional: copy .env.example to .env and configure CAREERPULSE_CORS_ORIGINS
uvicorn app.main:app --reload
```

The API runs at http://localhost:8000. Interactive API documentation is at http://localhost:8000/docs.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The Vite app runs at http://localhost:5173. Set `VITE_API_URL` in the frontend environment to the deployed API URL when hosting the frontend elsewhere.

## Configuration

Set `CAREERPULSE_CORS_ORIGINS` on the backend to a comma-separated list of exact frontend origins, for example:

```text
CAREERPULSE_CORS_ORIGINS=https://your-frontend.example.com,http://localhost:5173
```

Do not include trailing paths in an origin. Keep only trusted frontend origins in production.

## API endpoints

- `GET /api/health` — service health.
- `GET /api/jobs` — illustrative sample job profiles.
- `POST /api/analyze` — analyze an uploaded resume.
- `POST /api/analyze-text` — analyze supplied text (minimum 40 characters).

## Tests

```bash
cd backend
pytest
```

GitHub Actions runs backend tests and a frontend production build for pushes and pull requests.

## Important limitations

- The score is a transparent heuristic practice score, not a real ATS score, hiring prediction, or guarantee of selection.
- Job profiles are sample data, not live vacancies or verified openings.
- Skill detection is based on a small keyword catalog; it does not understand context or proficiency.
- DOCX text extraction includes paragraphs and table cells. PDF extraction reads embedded text only; scanned/image-only PDFs require OCR and may return a “not enough readable text” error.
- No user accounts, database, persistent resume storage, OCR, or production deployment configuration are included in this MVP.

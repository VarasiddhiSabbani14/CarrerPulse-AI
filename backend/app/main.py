from __future__ import annotations

import re
from collections import Counter
from io import BytesIO
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="CareerPulse AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

STOP_WORDS = {
    "about", "above", "after", "again", "against", "being", "below", "between",
    "could", "doing", "during", "from", "have", "having", "into", "more",
    "most", "other", "over", "same", "some", "such", "than", "that", "their",
    "them", "then", "there", "these", "they", "this", "those", "through",
    "under", "very", "what", "when", "where", "which", "while", "with", "would",
    "your", "you", "and", "for", "the", "are", "was", "were", "will", "our",
    "has", "had", "but", "not", "use", "used",
}

class AnalyzeTextRequest(BaseModel):
    text: str = Field(min_length=40, max_length=100_000)

def extract_text(data: bytes, filename: str) -> str:
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    try:
        if suffix == "txt":
            return data.decode("utf-8", errors="replace")
        if suffix == "pdf":
            from pypdf import PdfReader
            reader = PdfReader(BytesIO(data))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        if suffix == "docx":
            from docx import Document
            document = Document(BytesIO(data))
            return "\n".join(p.text for p in document.paragraphs)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read document: {exc}") from exc
    raise HTTPException(status_code=415, detail="Upload a PDF, DOCX, or TXT file.")

def analyze_resume(text: str) -> dict[str, Any]:
    words = re.findall(r"[A-Za-z][A-Za-z+#.]{1,}", text.lower())
    counts = Counter(w for w in words if w not in STOP_WORDS)
    skills_catalog = [
        "python", "java", "javascript", "typescript", "react", "fastapi", "django",
        "sql", "mysql", "postgresql", "mongodb", "html", "css", "git", "docker",
        "aws", "azure", "machine learning", "data analysis", "communication",
        "leadership", "problem solving", "api", "rest",
    ]
    found = sorted({skill for skill in skills_catalog if skill in text.lower()})
    sections = {
        "contact": bool(re.search(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b", text)),
        "skills": bool(re.search(r"\bskills?\b", text, re.I)),
        "education": bool(re.search(r"\beducation\b", text, re.I)),
        "experience": bool(re.search(r"\b(experience|internship|employment)\b", text, re.I)),
        "projects": bool(re.search(r"\bprojects?\b", text, re.I)),
    }
    section_score = sum(sections.values()) / len(sections) * 35
    skill_score = min(len(found) / 8, 1) * 35
    length_score = 15 if 250 <= len(words) <= 1200 else (8 if len(words) >= 100 else 3)
    action_score = min(len(re.findall(r"\b(built|developed|created|led|designed|improved|implemented|managed)\b", text, re.I)) / 5, 1) * 15
    score = round(section_score + skill_score + length_score + action_score)
    suggestions = []
    if not sections["contact"]: suggestions.append("Add a professional email address and contact details.")
    if not sections["skills"]: suggestions.append("Add a clearly labelled Skills section.")
    if not sections["projects"]: suggestions.append("Include relevant projects and explain your contribution.")
    if not sections["experience"]: suggestions.append("Add internships, work experience, or relevant practical experience.")
    if len(found) < 5: suggestions.append("Include relevant technical and role-specific skills where you genuinely have them.")
    if action_score < 9: suggestions.append("Start achievement bullets with action verbs and add measurable outcomes.")
    if len(words) < 250: suggestions.append("Add more detail about projects, responsibilities, and measurable results.")
    return {
        "score": min(score, 100),
        "word_count": len(words),
        "skills": found,
        "sections": sections,
        "suggestions": suggestions or ["Your resume has a useful structure. Tailor it to each job description."],
        "top_keywords": [word for word, _ in counts.most_common(8)],
        "disclaimer": "This is a heuristic practice score, not a real ATS result or hiring prediction.",
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "CareerPulse AI API"}

@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    filename = file.filename or ""
    if len(filename) > 255:
        raise HTTPException(status_code=400, detail="Filename is too long.")
    data = await file.read(5 * 1024 * 1024 + 1)
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File must be 5 MB or smaller.")
    text = extract_text(data, filename)
    if len(text.strip()) < 40:
        raise HTTPException(status_code=422, detail="Not enough readable text found in the document.")
    return analyze_resume(text)

@app.post("/api/analyze-text")
def analyze_text(payload: AnalyzeTextRequest):
    return analyze_resume(payload.text)

@app.get("/api/jobs")
def jobs():
    return [
        {"id": 1, "title": "Python Developer Intern", "company": "Example Technologies", "location": "Hyderabad / Remote", "type": "Internship", "skills": ["python", "api", "sql"]},
        {"id": 2, "title": "Frontend Developer", "company": "Example Digital", "location": "Hyderabad", "type": "Entry level", "skills": ["javascript", "react", "html", "css"]},
        {"id": 3, "title": "Junior Data Analyst", "company": "Example Analytics", "location": "Remote", "type": "Entry level", "skills": ["sql", "data analysis", "python"]},
    ]

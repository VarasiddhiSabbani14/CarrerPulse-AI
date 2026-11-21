from io import BytesIO

from docx import Document
from fastapi.testclient import TestClient

from app.main import analyze_resume, app, extract_text

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analyze_text_returns_score():
    text = ("Alex Developer alex@example.com\nSkills Python Java React SQL\n"
            "Education Bachelor degree\nProjects Built and developed an API. " * 8)
    response = client.post("/api/analyze-text", json={"text": text})
    assert response.status_code == 200
    assert 0 <= response.json()["score"] <= 100
    assert "python" in response.json()["skills"]


def test_javascript_does_not_imply_java():
    result = analyze_resume("JavaScript developer building web applications with JavaScript.")
    assert "javascript" in result["skills"]
    assert "java" not in result["skills"]


def test_docx_table_text_is_extracted():
    document = Document()
    table = document.add_table(rows=1, cols=2)
    table.cell(0, 0).text = "Skills"
    table.cell(0, 1).text = "Python and React"
    buffer = BytesIO()
    document.save(buffer)
    extracted = extract_text(buffer.getvalue(), "resume.docx")
    assert "Python and React" in extracted


def test_rejects_short_text():
    response = client.post("/api/analyze-text", json={"text": "too short"})
    assert response.status_code == 422


def test_job_list():
    response = client.get("/api/jobs")
    assert response.status_code == 200
    assert len(response.json()) >= 1

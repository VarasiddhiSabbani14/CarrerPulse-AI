from fastapi.testclient import TestClient
from app.main import app, analyze_resume

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

def test_rejects_short_text():
    response = client.post("/api/analyze-text", json={"text": "too short"})
    assert response.status_code == 422

def test_job_list():
    response = client.get("/api/jobs")
    assert response.status_code == 200
    assert len(response.json()) >= 1

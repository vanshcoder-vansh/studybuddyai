"""StudyBuddy AI backend regression tests.
Covers: auth/me, profile, dashboard, chat, scan, notes, tests, planner,
formulas, papers, leaderboard, xp/award. Uses Bearer token from MongoDB-seeded session.
"""
import os
import io
import time
import base64
import pytest
import requests
import subprocess
import json

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://522b0f96-615f-498f-8ce7-b2a931c8c47c.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _seed_user():
    """Seed a fresh test user + session via mongosh."""
    script = """
use('studybuddy_db');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId, email: 'TEST_'+Date.now()+'@example.com', name: 'TEST User',
  picture: null, class_grade: '10', board: 'CBSE',
  subjects: ['Math','Science','English'], language: 'English',
  exam_goal: 'Score 95%+', xp: 0, streak: 0, last_active_date: null,
  badges: [], plan: 'free', onboarded: true, created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId, session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000), created_at: new Date()
});
print('TOKEN='+sessionToken);
print('USER_ID='+userId);
"""
    out = subprocess.check_output(["mongosh", "--quiet", "--eval", script]).decode()
    token, uid = None, None
    for line in out.splitlines():
        if line.startswith("TOKEN="): token = line.split("=", 1)[1].strip()
        if line.startswith("USER_ID="): uid = line.split("=", 1)[1].strip()
    return token, uid


@pytest.fixture(scope="session")
def auth():
    token, uid = _seed_user()
    assert token and uid
    return {"token": token, "user_id": uid, "headers": {"Authorization": f"Bearer {token}"}}


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/health", timeout=30)
    assert r.status_code == 200
    j = r.json()
    assert j["ok"] is True


# ---------- Auth ----------
def test_auth_me_no_token():
    r = requests.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 401


def test_auth_me_with_token(auth):
    r = requests.get(f"{API}/auth/me", headers=auth["headers"], timeout=30)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["user_id"] == auth["user_id"]
    assert j["onboarded"] is True


def test_google_session_endpoint_exists():
    # We expect 400 (session_id required) or 401 - just verify wired
    r = requests.post(f"{API}/auth/google/session", json={}, timeout=30)
    assert r.status_code in (400, 401, 422)


# ---------- Profile ----------
def test_profile_update(auth):
    r = requests.put(f"{API}/profile", headers=auth["headers"],
                     json={"exam_goal": "TEST goal", "language": "Hinglish"}, timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["exam_goal"] == "TEST goal"
    assert j["language"] == "Hinglish"
    # verify persisted via /auth/me
    me = requests.get(f"{API}/auth/me", headers=auth["headers"], timeout=30).json()
    assert me["exam_goal"] == "TEST goal"


# ---------- Dashboard ----------
def test_dashboard_shape(auth):
    r = requests.get(f"{API}/dashboard", headers=auth["headers"], timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ("user", "today_tasks", "recent_chats", "recent_notes", "weekly_xp", "subjects", "quote"):
        assert k in j, f"missing {k}"
    assert isinstance(j["weekly_xp"], list) and len(j["weekly_xp"]) == 7


# ---------- Chat (AI) ----------
def test_chat_basic(auth):
    r = requests.post(f"{API}/chat", headers=auth["headers"],
                      json={"message": "What is 2+2?", "subject": "Math", "style": "short"}, timeout=60)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "answer" in j and len(j["answer"]) > 0
    assert "session_id" in j
    # XP awarded
    me = requests.get(f"{API}/auth/me", headers=auth["headers"], timeout=30).json()
    assert me["xp"] >= 5


# ---------- Homework Scan (AI vision) ----------
def test_scan_homework(auth):
    # 1x1 PNG
    png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    img = base64.b64decode(png_b64)
    files = {"image": ("test.png", io.BytesIO(img), "image/png")}
    data = {"mode": "explain", "language": "English"}
    r = requests.post(f"{API}/scan", headers=auth["headers"], files=files, data=data, timeout=60)
    assert r.status_code == 200, r.text
    assert "answer" in r.json()


# ---------- Notes ----------
def test_notes_crud(auth):
    r = requests.post(f"{API}/notes", headers=auth["headers"],
                      json={"subject": "Math", "chapter": "Algebra",
                            "class_grade": "10", "board": "CBSE",
                            "style": "short", "language": "English"}, timeout=60)
    assert r.status_code == 200, r.text
    note = r.json()
    nid = note["note_id"]
    assert note["content"]
    # list
    lst = requests.get(f"{API}/notes", headers=auth["headers"], timeout=30).json()
    assert any(n["note_id"] == nid for n in lst)
    # get one
    g = requests.get(f"{API}/notes/{nid}", headers=auth["headers"], timeout=30)
    assert g.status_code == 200 and g.json()["note_id"] == nid
    # delete
    d = requests.delete(f"{API}/notes/{nid}", headers=auth["headers"], timeout=30)
    assert d.status_code == 200
    g2 = requests.get(f"{API}/notes/{nid}", headers=auth["headers"], timeout=30)
    assert g2.status_code == 404


# ---------- Tests (AI) ----------
def test_tests_generate_and_submit(auth):
    r = requests.post(f"{API}/tests/generate", headers=auth["headers"],
                      json={"subject": "Math", "class_grade": "10",
                            "difficulty": "easy", "num_questions": 3,
                            "duration_min": 10, "board": "CBSE"}, timeout=90)
    assert r.status_code == 200, r.text
    t = r.json()
    tid = t["test_id"]
    assert len(t["questions"]) >= 1
    # submit (all "A")
    ans = ["A"] * len(t["questions"])
    s = requests.post(f"{API}/tests/{tid}/submit", headers=auth["headers"],
                      json={"answers": ans, "time_taken_sec": 60}, timeout=15)
    assert s.status_code == 200, s.text
    js = s.json()
    assert "score" in js and "detail" in js
    assert len(js["detail"]) == len(t["questions"])


# ---------- Planner ----------
def test_planner_crud(auth):
    # create
    r = requests.post(f"{API}/planner/tasks", headers=auth["headers"],
                      json={"title": "TEST task", "subject": "Math",
                            "date": "2026-05-20", "duration_min": 30}, timeout=30)
    assert r.status_code == 200
    tid = r.json()["task_id"]
    # list
    lst = requests.get(f"{API}/planner/tasks", headers=auth["headers"], timeout=30).json()
    assert any(t["task_id"] == tid for t in lst)
    # patch complete
    p = requests.patch(f"{API}/planner/tasks/{tid}", headers=auth["headers"],
                       json={"completed": True}, timeout=30)
    assert p.status_code == 200 and p.json()["completed"] is True
    # delete
    d = requests.delete(f"{API}/planner/tasks/{tid}", headers=auth["headers"], timeout=30)
    assert d.status_code == 200


def test_planner_generate(auth):
    # Use a very short window (3 days) so AI response fits within preview ingress timeout
    from datetime import datetime as _dt, timedelta as _td
    short_exam = (_dt.utcnow().date() + _td(days=3)).isoformat()
    r = requests.post(f"{API}/planner/generate", headers=auth["headers"],
                      json={"exam_date": short_exam,
                            "weak_subjects": ["Math"], "hours_per_day": 2}, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "tasks" in j and isinstance(j["tasks"], list)


# ---------- Formulas / Papers ----------
def test_formulas_all():
    r = requests.get(f"{API}/formulas", timeout=30)
    assert r.status_code == 200
    assert len(r.json()) > 0


def test_formulas_filter():
    r = requests.get(f"{API}/formulas", params={"subject": "Physics"}, timeout=30)
    assert r.status_code == 200
    assert all(f["subject"] == "Physics" for f in r.json())


def test_papers_filter():
    r = requests.get(f"{API}/papers", params={"board": "CBSE", "class_grade": "10"}, timeout=30)
    assert r.status_code == 200
    rows = r.json()
    assert all(p["board"] == "CBSE" and p["class_grade"] == "10" for p in rows)


# ---------- Leaderboard ----------
def test_leaderboard(auth):
    r = requests.get(f"{API}/leaderboard", timeout=30)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------- XP Award ----------
def test_xp_award(auth):
    before = requests.get(f"{API}/auth/me", headers=auth["headers"], timeout=30).json()
    r = requests.post(f"{API}/xp/award", headers=auth["headers"],
                      json={"amount": 50, "reason": "TEST"}, timeout=30)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["xp"] >= before["xp"] + 50
    assert j["streak"] >= 1


# ---------- Logout ----------
def test_logout(auth):
    # use separate seed so we don't kill main session
    token, _ = _seed_user()
    h = {"Authorization": f"Bearer {token}"}
    # logout requires cookie (per impl)
    r = requests.post(f"{API}/auth/logout", cookies={"session_token": token}, timeout=30)
    assert r.status_code == 200

"""StudyBuddy AI - FastAPI Backend
Routes (all /api prefixed):
  Auth: /auth/google/session, /auth/me, /auth/logout
  Profile: /profile (PUT)
  Dashboard: /dashboard
  Chat (Doubt Solver): /chat
  Homework Scanner: /scan
  Notes: /notes (POST generate, GET list, GET :id, DELETE :id)
  Tests: /tests/generate, /tests/:id, /tests/:id/submit
  Planner: /planner/tasks (CRUD), /planner/generate
  Formulas: /formulas
  Papers: /papers
  Gamification: /xp/award, /leaderboard
"""
import os
import uuid
import base64
import logging
from datetime import datetime, timezone, timedelta, date
from typing import Optional, List, Literal

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Header, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import httpx

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

# ---------- Config ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("studybuddy")

# ---------- DB ----------
mongo = AsyncIOMotorClient(MONGO_URL)
db = mongo[DB_NAME]

# ---------- App ----------
app = FastAPI(title="StudyBuddy AI")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models ----------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    class_grade: Optional[str] = None  # "6"-"12"
    board: Optional[str] = None  # "CBSE" / "ICSE"
    subjects: List[str] = []
    language: str = "English"  # English / Hindi / Hinglish
    exam_goal: Optional[str] = None
    xp: int = 0
    streak: int = 0
    last_active_date: Optional[str] = None
    badges: List[str] = []
    plan: str = "free"
    onboarded: bool = False
    created_at: str

class ProfileUpdate(BaseModel):
    class_grade: Optional[str] = None
    board: Optional[str] = None
    subjects: Optional[List[str]] = None
    language: Optional[str] = None
    exam_goal: Optional[str] = None
    onboarded: Optional[bool] = None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    subject: Optional[str] = "General"
    style: Literal["short", "detailed", "exam"] = "detailed"
    language: Optional[str] = "English"

class NotesRequest(BaseModel):
    subject: str
    chapter: str
    class_grade: str
    board: str = "CBSE"
    style: Literal["short", "detailed", "bullets", "flashcards", "mindmap", "formulas", "revision"] = "short"
    language: str = "English"

class TestGenerateRequest(BaseModel):
    subject: str
    chapter: Optional[str] = None
    class_grade: str
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    num_questions: int = 5
    duration_min: int = 15
    board: str = "CBSE"

class TestSubmit(BaseModel):
    answers: List[str]
    time_taken_sec: int = 0

class TaskCreate(BaseModel):
    title: str
    subject: Optional[str] = None
    date: str  # YYYY-MM-DD
    duration_min: int = 30
    notes: Optional[str] = None

class TaskUpdate(BaseModel):
    completed: Optional[bool] = None
    title: Optional[str] = None
    notes: Optional[str] = None

class PlannerGenerate(BaseModel):
    exam_date: str
    weak_subjects: List[str] = []
    hours_per_day: int = 2

class XPAward(BaseModel):
    amount: int
    reason: str

# ---------- Auth helpers ----------
async def get_current_user(
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> User:
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")
    exp = sess["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def today_str() -> str:
    return datetime.now(timezone.utc).date().isoformat()

# ---------- Auth routes ----------
@api.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    """Exchange session_id from Emergent OAuth for our session_token."""
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="OAuth verification failed")
    data = r.json()
    email = data["email"]
    name = data["name"]
    picture = data.get("picture")
    session_token = data["session_token"]

    # Upsert user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "class_grade": None,
            "board": None,
            "subjects": [],
            "language": "English",
            "exam_goal": None,
            "xp": 0,
            "streak": 0,
            "last_active_date": None,
            "badges": [],
            "plan": "free",
            "onboarded": False,
            "created_at": now_iso(),
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    else:
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}},
        )
        user["name"] = name
        user["picture"] = picture

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })

    # cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600,
    )
    user.pop("_id", None)
    return {"user": user, "session_token": session_token}

@api.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(default=None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def auth_me_route(user: User = Depends(get_current_user)):
    return user

# ---------- Profile ----------
@api.put("/profile")
async def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_user)):
    update = {k: v for k, v in payload.dict().items() if v is not None}
    if update:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update})
    new_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return new_user

# ---------- Gamification utility ----------
async def award_xp_internal(user_id: str, amount: int, reason: str = ""):
    today = today_str()
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return
    last = user.get("last_active_date")
    streak = user.get("streak", 0)
    if last == today:
        pass  # already active today, streak unchanged
    elif last is None:
        streak = 1
    else:
        try:
            last_d = date.fromisoformat(last)
            today_d = date.fromisoformat(today)
            delta = (today_d - last_d).days
            if delta == 1:
                streak = streak + 1
            elif delta > 1:
                streak = 1
        except Exception:
            streak = max(streak, 1)
    badges = set(user.get("badges", []))
    new_xp = user.get("xp", 0) + amount
    # Badge rules
    if new_xp >= 100: badges.add("Bronze Scholar")
    if new_xp >= 500: badges.add("Silver Scholar")
    if new_xp >= 1500: badges.add("Gold Scholar")
    if streak >= 3: badges.add("3-Day Streak")
    if streak >= 7: badges.add("Week Warrior")
    if streak >= 30: badges.add("Month Master")
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "xp": new_xp,
            "streak": streak,
            "last_active_date": today,
            "badges": sorted(list(badges)),
        }},
    )
    await db.activity.insert_one({
        "activity_id": f"act_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "xp",
        "amount": amount,
        "reason": reason,
        "at": now_iso(),
    })

@api.post("/xp/award")
async def xp_award(payload: XPAward, user: User = Depends(get_current_user)):
    await award_xp_internal(user.user_id, payload.amount, payload.reason)
    fresh = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {"xp": fresh["xp"], "streak": fresh["streak"], "badges": fresh["badges"]}

@api.get("/leaderboard")
async def leaderboard():
    rows = await db.users.find({}, {"_id": 0, "name": 1, "picture": 1, "xp": 1, "streak": 1, "user_id": 1}).sort("xp", -1).limit(20).to_list(20)
    return rows

# ---------- LLM helpers ----------
def style_prompt(style: str, language: str) -> str:
    if style == "short":
        s = "Give a concise short answer (3-5 lines). Plain language."
    elif style == "exam":
        s = "Answer in exam-style format: clear headings, step-by-step working, mark-worthy points, final answer highlighted."
    else:
        s = "Give a detailed, step-by-step explanation. Use simple words for a school student. Use bullet points and bold key terms."
    lang = {
        "English": "Reply in English.",
        "Hindi": "Reply in Hindi using Devanagari script.",
        "Hinglish": "Reply in Hinglish (Roman script mixing Hindi and English casually). Be friendly and warm.",
    }.get(language, "Reply in English.")
    return f"{s} {lang}"

async def llm_chat(system: str, message: str, session_id: str, image_b64: Optional[str] = None) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model("gemini", "gemini-2.5-flash")
    if image_b64:
        msg = UserMessage(text=message, file_contents=[ImageContent(image_base64=image_b64)])
    else:
        msg = UserMessage(text=message)
    resp = await chat.send_message(msg)
    return resp if isinstance(resp, str) else str(resp)

# ---------- Doubt Solver (Chat) ----------
@api.post("/chat")
async def chat(payload: ChatRequest, user: User = Depends(get_current_user)):
    session_id = payload.session_id or f"chat_{user.user_id}_{uuid.uuid4().hex[:8]}"
    style_dir = style_prompt(payload.style, payload.language or user.language)
    system = (
        f"You are StudyBuddy AI — a friendly, encouraging tutor for an Indian "
        f"{user.board or 'CBSE'} Class {user.class_grade or '10'} student. "
        f"Subject context: {payload.subject}. {style_dir} "
        f"If math: show every step. If science: explain the concept then the answer. "
        f"End with one short motivational nudge."
    )
    answer = await llm_chat(system, payload.message, session_id)
    await db.chat_messages.insert_one({
        "msg_id": f"msg_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "session_id": session_id,
        "subject": payload.subject,
        "style": payload.style,
        "question": payload.message,
        "answer": answer,
        "created_at": now_iso(),
    })
    await award_xp_internal(user.user_id, 5, "doubt-solved")
    return {"answer": answer, "session_id": session_id}

@api.get("/chat/history")
async def chat_history(user: User = Depends(get_current_user)):
    rows = await db.chat_messages.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return rows

# ---------- Homework Scanner ----------
@api.post("/scan")
async def scan_homework(
    user: User = Depends(get_current_user),
    image: UploadFile = File(...),
    mode: str = Form("explain"),  # explain | hinglish | simpler | practice
    language: str = Form("English"),
):
    raw = await image.read()
    b64 = base64.b64encode(raw).decode()
    instr = {
        "explain": "Read the homework problem in the image and explain it step-by-step in clear, simple language.",
        "simpler": "Read the homework problem and explain it in the SIMPLEST possible words, as if to a beginner. Use everyday analogies.",
        "hinglish": "Read the homework problem and explain it in Hinglish (Roman-script, friendly tone). Use casual student language.",
        "practice": "Read the homework problem and create 3 SIMILAR practice questions with answers, increasing in difficulty.",
    }.get(mode, "Explain step by step in simple language.")
    system = (
        f"You are StudyBuddy AI. The student is Class {user.class_grade or '10'} {user.board or 'CBSE'}. "
        "When given an image of a homework problem: 1) restate the question in text, 2) outline approach, "
        "3) solve step-by-step with formulas highlighted using **bold**, 4) state final answer clearly, "
        "5) one tip to remember the concept."
    )
    session_id = f"scan_{user.user_id}_{uuid.uuid4().hex[:8]}"
    answer = await llm_chat(system, instr, session_id, image_b64=b64)
    await db.scans.insert_one({
        "scan_id": f"scan_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "mode": mode,
        "answer": answer,
        "created_at": now_iso(),
    })
    await award_xp_internal(user.user_id, 10, "homework-scanned")
    return {"answer": answer}

# ---------- Notes ----------
@api.post("/notes")
async def generate_notes(payload: NotesRequest, user: User = Depends(get_current_user)):
    style_map = {
        "short": "Generate SHORT crisp notes (1 page max). Headings, sub-bullets, key terms in **bold**.",
        "detailed": "Generate DETAILED notes covering all concepts with examples and 2-3 solved examples.",
        "bullets": "Generate notes as concise bullet points only. No paragraphs.",
        "flashcards": "Generate 10 flashcards. Format strictly as: 'Q: ...\\nA: ...' separated by blank lines.",
        "mindmap": "Generate a TEXT mind map using indented bullets and arrows. Central topic at top, branches with sub-branches.",
        "formulas": "List all important formulas with one-line explanation each. Use math notation.",
        "revision": "Generate a ONE-SHOT revision summary (under 200 words) covering the entire chapter.",
    }
    system = (
        f"You are StudyBuddy AI. Create study notes for Class {payload.class_grade} {payload.board} "
        f"Subject: {payload.subject}, Chapter: {payload.chapter}. "
        f"{style_map.get(payload.style, style_map['short'])} "
        f"{'Reply in Hindi.' if payload.language=='Hindi' else 'Reply in English.' if payload.language=='English' else 'Reply in Hinglish (friendly).'}"
    )
    session_id = f"notes_{user.user_id}_{uuid.uuid4().hex[:8]}"
    content = await llm_chat(system, f"Generate {payload.style} notes for {payload.subject} - {payload.chapter}.", session_id)
    doc = {
        "note_id": f"note_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "subject": payload.subject,
        "chapter": payload.chapter,
        "class_grade": payload.class_grade,
        "board": payload.board,
        "style": payload.style,
        "language": payload.language,
        "content": content,
        "created_at": now_iso(),
    }
    await db.notes.insert_one(doc)
    await award_xp_internal(user.user_id, 15, "notes-generated")
    doc.pop("_id", None)
    return doc

@api.get("/notes")
async def list_notes(user: User = Depends(get_current_user)):
    rows = await db.notes.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return rows

@api.get("/notes/{note_id}")
async def get_note(note_id: str, user: User = Depends(get_current_user)):
    row = await db.notes.find_one({"note_id": note_id, "user_id": user.user_id}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Note not found")
    return row

@api.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: User = Depends(get_current_user)):
    await db.notes.delete_one({"note_id": note_id, "user_id": user.user_id})
    return {"ok": True}

# ---------- Tests ----------
import json as _json
import re as _re

@api.post("/tests/generate")
async def tests_generate(payload: TestGenerateRequest, user: User = Depends(get_current_user)):
    system = (
        f"You are an exam-paper setter for {payload.board} Class {payload.class_grade}. "
        f"Create exactly {payload.num_questions} multiple-choice questions. "
        f"Difficulty: {payload.difficulty}. Subject: {payload.subject}"
        + (f", Chapter: {payload.chapter}" if payload.chapter else "")
        + ". Return ONLY valid JSON (no markdown fences) in this exact shape: "
        '{"questions":[{"q":"...","options":["A","B","C","D"],"answer":"A","explanation":"..."}]}'
    )
    session_id = f"test_{user.user_id}_{uuid.uuid4().hex[:8]}"
    raw = await llm_chat(system, f"Generate the test now.", session_id)
    # Strip code fences if any
    txt = raw.strip()
    if txt.startswith("```"):
        txt = _re.sub(r"^```(json)?", "", txt).strip()
        if txt.endswith("```"):
            txt = txt[:-3].strip()
    try:
        data = _json.loads(txt)
        questions = data["questions"]
    except Exception:
        # Try to find JSON object
        m = _re.search(r"\{[\s\S]*\}", raw)
        if m:
            data = _json.loads(m.group(0))
            questions = data["questions"]
        else:
            raise HTTPException(500, "AI returned invalid format")
    test_id = f"test_{uuid.uuid4().hex[:12]}"
    doc = {
        "test_id": test_id,
        "user_id": user.user_id,
        "subject": payload.subject,
        "chapter": payload.chapter,
        "class_grade": payload.class_grade,
        "difficulty": payload.difficulty,
        "duration_min": payload.duration_min,
        "questions": questions,
        "created_at": now_iso(),
        "submitted": False,
        "score": None,
    }
    await db.tests.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/tests/{test_id}")
async def get_test(test_id: str, user: User = Depends(get_current_user)):
    row = await db.tests.find_one({"test_id": test_id, "user_id": user.user_id}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Test not found")
    return row

@api.post("/tests/{test_id}/submit")
async def submit_test(test_id: str, payload: TestSubmit, user: User = Depends(get_current_user)):
    row = await db.tests.find_one({"test_id": test_id, "user_id": user.user_id}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Test not found")
    qs = row["questions"]
    correct = 0
    detail = []
    for i, q in enumerate(qs):
        user_ans = payload.answers[i] if i < len(payload.answers) else ""
        is_correct = user_ans.strip().upper().startswith(q["answer"].strip().upper()[0]) if q.get("answer") else False
        if is_correct:
            correct += 1
        detail.append({
            "q": q["q"], "your": user_ans, "correct": q["answer"],
            "is_correct": is_correct, "explanation": q.get("explanation", ""),
        })
    score_pct = round(100 * correct / max(1, len(qs)))
    await db.tests.update_one({"test_id": test_id}, {"$set": {
        "submitted": True,
        "score": score_pct,
        "answers": payload.answers,
        "time_taken_sec": payload.time_taken_sec,
        "submitted_at": now_iso(),
    }})
    await award_xp_internal(user.user_id, 20 + correct * 5, f"test-{score_pct}")
    return {"score": score_pct, "correct": correct, "total": len(qs), "detail": detail}

@api.get("/tests")
async def list_tests(user: User = Depends(get_current_user)):
    rows = await db.tests.find({"user_id": user.user_id}, {"_id": 0, "questions": 0}).sort("created_at", -1).limit(20).to_list(20)
    return rows

# ---------- Planner ----------
@api.get("/planner/tasks")
async def list_tasks(user: User = Depends(get_current_user)):
    rows = await db.tasks.find({"user_id": user.user_id}, {"_id": 0}).sort("date", 1).to_list(200)
    return rows

@api.post("/planner/tasks")
async def create_task(payload: TaskCreate, user: User = Depends(get_current_user)):
    doc = {
        "task_id": f"task_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "title": payload.title,
        "subject": payload.subject,
        "date": payload.date,
        "duration_min": payload.duration_min,
        "notes": payload.notes,
        "completed": False,
        "created_at": now_iso(),
    }
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/planner/tasks/{task_id}")
async def update_task(task_id: str, payload: TaskUpdate, user: User = Depends(get_current_user)):
    update = {k: v for k, v in payload.dict().items() if v is not None}
    if update:
        await db.tasks.update_one({"task_id": task_id, "user_id": user.user_id}, {"$set": update})
    if payload.completed:
        await award_xp_internal(user.user_id, 10, "task-completed")
    row = await db.tasks.find_one({"task_id": task_id, "user_id": user.user_id}, {"_id": 0})
    return row

@api.delete("/planner/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user)):
    await db.tasks.delete_one({"task_id": task_id, "user_id": user.user_id})
    return {"ok": True}

@api.post("/planner/generate")
async def planner_generate(payload: PlannerGenerate, user: User = Depends(get_current_user)):
    # Cap window to keep LLM response under preview-ingress 60s timeout
    from datetime import date as _d
    try:
        exam_d = _d.fromisoformat(payload.exam_date)
        today_d = datetime.now(timezone.utc).date()
        days_until = max(1, (exam_d - today_d).days)
    except Exception:
        days_until = 7
    plan_days = min(days_until, 7)  # generate at most a week at a time
    tasks_per_day = 2
    max_tasks = plan_days * tasks_per_day
    today_iso = today_str()

    system = (
        f"You are a study coach for a Class {user.class_grade or '10'} {user.board or 'CBSE'} student. "
        f"Today's date is {today_iso}. Build a {plan_days}-day plan starting from {today_iso}. "
        f"Weak subjects to prioritise: {', '.join(payload.weak_subjects) or 'general revision'}. "
        f"{payload.hours_per_day} hrs/day, {tasks_per_day} tasks/day. "
        f"Return ONLY compact JSON, no markdown, max {max_tasks} tasks: "
        '{"tasks":[{"date":"YYYY-MM-DD","title":"...","subject":"...","duration_min":45}]}. '
        f"Dates MUST be sequential from {today_iso}. Keep titles under 8 words. No notes field."
    )
    session_id = f"plan_{user.user_id}_{uuid.uuid4().hex[:8]}"
    try:
        raw = await llm_chat(system, "Build the plan now.", session_id)
    except Exception as e:
        log.warning(f"planner LLM error: {e}")
        raise HTTPException(503, "AI is busy. Please try again in a moment.")
    txt = raw.strip()
    if txt.startswith("```"):
        txt = _re.sub(r"^```(json)?", "", txt).strip()
        if txt.endswith("```"):
            txt = txt[:-3].strip()
    try:
        data = _json.loads(txt)
    except Exception:
        m = _re.search(r"\{[\s\S]*\}", raw)
        try:
            data = _json.loads(m.group(0)) if m else {"tasks": []}
        except Exception:
            data = {"tasks": []}
    created = []
    today_d = datetime.now(timezone.utc).date()
    for idx, t in enumerate(data.get("tasks", [])[:max_tasks]):
        # Force-correct date: if AI gave bad/stale date, distribute sequentially across plan_days
        ai_date = t.get("date")
        try:
            d = _d.fromisoformat(ai_date) if ai_date else None
        except Exception:
            d = None
        if not d or d < today_d:
            d = today_d + timedelta(days=(idx // tasks_per_day) % plan_days)
        doc = {
            "task_id": f"task_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "title": t.get("title", "Study session"),
            "subject": t.get("subject"),
            "date": d.isoformat(),
            "duration_min": int(t.get("duration_min", 45)),
            "notes": None,
            "completed": False,
            "ai_generated": True,
            "created_at": now_iso(),
        }
        await db.tasks.insert_one(doc)
        doc.pop("_id", None)
        created.append(doc)
    return {"tasks": created}

# ---------- Dashboard summary ----------
@api.get("/dashboard")
async def dashboard(user: User = Depends(get_current_user)):
    today = today_str()
    today_tasks = await db.tasks.find({"user_id": user.user_id, "date": today}, {"_id": 0}).to_list(20)
    recent_chats = await db.chat_messages.find({"user_id": user.user_id}, {"_id": 0, "question": 1, "subject": 1, "created_at": 1}).sort("created_at", -1).limit(5).to_list(5)
    recent_notes = await db.notes.find({"user_id": user.user_id}, {"_id": 0, "note_id": 1, "subject": 1, "chapter": 1, "style": 1, "created_at": 1}).sort("created_at", -1).limit(5).to_list(5)
    # weekly activity - count per day last 7 days
    acts = await db.activity.find({"user_id": user.user_id}).sort("at", -1).limit(200).to_list(200)
    by_day = {}
    for a in acts:
        d = a["at"][:10]
        by_day[d] = by_day.get(d, 0) + a.get("amount", 0)
    weekly = []
    for i in range(6, -1, -1):
        d = (datetime.now(timezone.utc).date() - timedelta(days=i)).isoformat()
        weekly.append({"date": d, "xp": by_day.get(d, 0)})
    # tests for subject performance
    tests = await db.tests.find({"user_id": user.user_id, "submitted": True}, {"_id": 0, "subject": 1, "score": 1}).to_list(100)
    subj_perf = {}
    for t in tests:
        s = t["subject"]
        subj_perf.setdefault(s, []).append(t.get("score", 0))
    subjects = [{"subject": k, "score": round(sum(v)/len(v))} for k, v in subj_perf.items()]
    weak = sorted(subjects, key=lambda x: x["score"])[:3] if subjects else []

    quotes = [
        "Small steps every day beat big leaps once a week.",
        "You don't have to be great to start, but you have to start to be great.",
        "Discipline is choosing what you want most over what you want now.",
        "Every expert was once a beginner. Keep going.",
        "Your future self is watching you right now through memories.",
        "Focus on progress, not perfection.",
    ]
    import random
    quote = random.choice(quotes)

    return {
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "picture": user.picture,
            "xp": user.xp,
            "streak": user.streak,
            "badges": user.badges,
            "class_grade": user.class_grade,
            "board": user.board,
            "onboarded": user.onboarded,
        },
        "today_tasks": today_tasks,
        "recent_chats": recent_chats,
        "recent_notes": recent_notes,
        "weekly_xp": weekly,
        "subjects": subjects,
        "weak_subjects": weak,
        "quote": quote,
    }

# ---------- Formulas (seeded) ----------
SEED_FORMULAS = [
    {"subject": "Physics", "topic": "Motion", "title": "Equations of motion", "formula": "v = u + at  •  s = ut + ½at²  •  v² = u² + 2as", "explain": "u=initial vel, v=final vel, a=accel, s=displacement, t=time"},
    {"subject": "Physics", "topic": "Force", "title": "Newton's 2nd Law", "formula": "F = m × a", "explain": "Force equals mass times acceleration."},
    {"subject": "Physics", "topic": "Work & Energy", "title": "Kinetic Energy", "formula": "KE = ½mv²", "explain": "Energy a body has due to its motion."},
    {"subject": "Math", "topic": "Algebra", "title": "Quadratic formula", "formula": "x = (-b ± √(b² - 4ac)) / 2a", "explain": "Roots of ax² + bx + c = 0."},
    {"subject": "Math", "topic": "Trigonometry", "title": "Pythagoras identity", "formula": "sin²θ + cos²θ = 1", "explain": "Foundational trig identity."},
    {"subject": "Math", "topic": "Geometry", "title": "Area of circle", "formula": "A = πr²", "explain": "r is the radius."},
    {"subject": "Math", "topic": "Mensuration", "title": "Sphere volume", "formula": "V = (4/3)πr³", "explain": "Volume enclosed by a sphere."},
    {"subject": "Chemistry", "topic": "Mole concept", "title": "Number of moles", "formula": "n = mass / molar mass", "explain": "Used in stoichiometry."},
    {"subject": "Chemistry", "topic": "Gases", "title": "Ideal gas law", "formula": "PV = nRT", "explain": "Pressure, volume, moles, temperature."},
    {"subject": "Biology", "topic": "Genetics", "title": "Punnett square", "formula": "Aa × Aa → 1AA : 2Aa : 1aa", "explain": "Mendelian inheritance ratios."},
]

SEED_PAPERS = [
    {"board": "CBSE", "class_grade": "10", "subject": "Science", "year": 2024, "topics": ["Light", "Chemical Reactions", "Life Processes"], "trend": "Reflection problems and Periodic Table questions appear every year."},
    {"board": "CBSE", "class_grade": "10", "subject": "Math", "year": 2024, "topics": ["Trigonometry", "Statistics", "Quadratic Eqns"], "trend": "Heights & Distances + Probability are repeated favorites."},
    {"board": "CBSE", "class_grade": "12", "subject": "Physics", "year": 2024, "topics": ["EM Induction", "Optics", "Modern Physics"], "trend": "Ray optics and AC circuits dominate."},
    {"board": "ICSE", "class_grade": "10", "subject": "Math", "year": 2024, "topics": ["GST", "Banking", "Coordinate Geometry"], "trend": "Banking & GST questions are guaranteed marks."},
    {"board": "CBSE", "class_grade": "10", "subject": "English", "year": 2024, "topics": ["First Flight", "Footprints"], "trend": "Long answers on character analysis appear yearly."},
    {"board": "CBSE", "class_grade": "10", "subject": "Social Science", "year": 2023, "topics": ["Nationalism in India", "Money & Credit"], "trend": "Map work + 5-mark long answers from History."},
]

@api.get("/formulas")
async def get_formulas(subject: Optional[str] = None):
    if subject:
        return [f for f in SEED_FORMULAS if f["subject"].lower() == subject.lower()]
    return SEED_FORMULAS

@api.get("/papers")
async def get_papers(board: Optional[str] = None, class_grade: Optional[str] = None, subject: Optional[str] = None):
    rows = SEED_PAPERS
    if board: rows = [r for r in rows if r["board"] == board]
    if class_grade: rows = [r for r in rows if r["class_grade"] == class_grade]
    if subject: rows = [r for r in rows if r["subject"].lower() == subject.lower()]
    return rows

# ---------- Health ----------
@api.get("/health")
async def health():
    return {"ok": True, "service": "studybuddy", "time": now_iso()}

# Mount the router
app.include_router(api)

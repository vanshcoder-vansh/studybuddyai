# StudyBuddy AI - Product Requirements

## Problem Statement (Original)
Build a modern AI-powered student learning platform "StudyBuddy AI" for Grade 6–12 CBSE/ICSE students in India. Combines ChatGPT + Notion + Duolingo + Khan Academy + Byju's. Must look investor-ready.

## Architecture
- **Frontend**: React 18 + Tailwind CSS + lucide-react + framer-motion + recharts + sonner toasts. React Router v6. Custom UI (Apple+Notion inspired, coral primary `#FF6B6B`, NOT purple/teal).
- **Backend**: FastAPI + MongoDB (motor async). All routes `/api/*`. Cookie-based sessions (Emergent Google OAuth).
- **AI**: emergentintegrations library — Gemini 2.5 Flash (text + vision for OCR).
- **Auth**: Emergent Google OAuth, 7-day cookie sessions.

## Core User Personas
- Indian student grades 6–12 (CBSE/ICSE primary)
- Wants quick homework help, exam-style practice, daily routine

## Implemented (May 2026 - v1)
**Landing page** with hero, stats, features, showcase, testimonials, pricing, FAQ, CTA, footer + dark/light toggle.

**Auth**: Emergent Google OAuth (`/api/auth/google/session`, `/api/auth/me`, `/api/auth/logout`).

**Onboarding**: 5-step setup (class, board, subjects, language, goal).

**Dashboard**: stats cards (streak/XP/badges/class), quick actions, weekly XP area chart, subject performance bar chart, today's tasks, recent activity, motivational quote.

**Doubt Solver**: AI chat with subject filter, style toggle (short/detailed/exam), language (En/Hi/Hinglish), text-to-speech via Web Speech API.

**Homework Scanner**: image upload + Gemini vision OCR. Modes: step-by-step, simpler, Hinglish, practice questions. TTS support.

**Smart Notes**: generate chapter notes in 7 styles (short/detailed/bullets/flashcards/mindmap/formulas/revision), save/list/delete, download as .txt.

**Test Generator**: AI-built MCQ tests, difficulty/duration/count config, live timer, auto-grade, per-question feedback, XP rewards.

**Study Planner**: 14-day strip, manual task CRUD, AI plan generator (exam date + weak subjects + hours/day).

**Profile**: edit class/board/subjects/language/goal, view XP/streak/badges, logout.

**Formula Hub**: searchable + subject-filtered formula cards (seeded data).

**Focus Timer**: 25-min Pomodoro with circular progress, modes (focus/short/long), round counter.

**More page**: leaderboard, past papers (seeded with AI trend analysis), quick links to all sections, theme toggle, logout.

**Gamification**: XP awarded for chat/scan/notes/test/task-complete. Streak auto-tracking. 6 badge tiers (Bronze/Silver/Gold scholar + 3-day/Week/Month streak).

## Deferred (P1/P2)
- Parent Dashboard (P1)
- Teacher Mode + assignment uploads (P1)
- Admin Panel (P1)
- PDF book ingestion + summarisation (P1)
- Community discussions (P2)
- Premium TTS (ElevenLabs/OpenAI) (P2)
- Stripe/Razorpay premium subscription flow (P2)
- Push notifications + email reminders (P2)
- Mobile app builds (P2)

## Next Action Items
- After user feedback, ship Parent Dashboard + Teacher Mode
- Wire Stripe for "Go Pro" CTA on Landing & gated features
- Add ElevenLabs voice tutor (paid premium)
- PDF textbook upload via Emergent object storage

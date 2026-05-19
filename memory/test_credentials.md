# StudyBuddy AI - Test Credentials

Authentication: **Emergent-managed Google OAuth** (no password-based auth).

## How to test auth-gated pages
1. Insert a test user + session in MongoDB (DB: `studybuddy_db`):

```bash
mongosh --eval "
use('studybuddy_db');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'aarav.test@example.com',
  name: 'Aarav Sharma',
  picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
  class_grade: '10', board: 'CBSE',
  subjects: ['Math','Science','English'],
  language: 'English', exam_goal: 'Score 95%+',
  xp: 0, streak: 0, last_active_date: null, badges: [],
  plan: 'free', onboarded: true,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId, session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('TOKEN=' + sessionToken);
print('USER_ID=' + userId);
"
```

2. Use the token in:
   - **Backend (curl)**: `-H "Authorization: Bearer <TOKEN>"`
   - **Browser (Playwright)**: Add cookie `session_token=<TOKEN>` (httpOnly, secure, sameSite=None)

## Test account profile (after seed)
- Email: `aarav.test@example.com`
- Name: Aarav Sharma
- Class: 10, Board: CBSE
- Subjects: Math, Science, English
- Onboarded: true (skips onboarding, goes straight to dashboard)

## RBAC
Single role: `student` (all routes are student-level). No admin/teacher panel yet.

## Domains/Email Allowlist
No allowlist. Any Google account is allowed.

## Cleanup
```bash
mongosh --eval "use('studybuddy_db'); db.users.deleteMany({email: /test|example/}); db.user_sessions.deleteMany({session_token: /^test_session_/});"
```

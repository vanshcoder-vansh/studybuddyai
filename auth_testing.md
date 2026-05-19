# Auth-Gated App Testing Playbook (StudyBuddy AI)

## Step 1: Create Test User & Session
mongosh --eval "
use('studybuddy_db');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Aarav Sharma',
  picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
  class_grade: '10',
  board: 'CBSE',
  subjects: ['Math','Science','English'],
  language: 'English',
  exam_goal: 'Score 95%+',
  xp: 0,
  streak: 0,
  last_active_date: null,
  badges: [],
  plan: 'free',
  onboarded: true,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"

## Step 2: Test Backend API
# Auth
curl "https://522b0f96-615f-498f-8ce7-b2a931c8c47c.preview.emergentagent.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Dashboard
curl "https://522b0f96-615f-498f-8ce7-b2a931c8c47c.preview.emergentagent.com/api/dashboard" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Doubt solver
curl -X POST "https://522b0f96-615f-498f-8ce7-b2a931c8c47c.preview.emergentagent.com/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"message":"What is Newtons second law","subject":"Physics","style":"short"}'

## Step 3: Browser Testing (Playwright)
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "522b0f96-615f-498f-8ce7-b2a931c8c47c.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://522b0f96-615f-498f-8ce7-b2a931c8c47c.preview.emergentagent.com/dashboard")

## Checklist
- [x] User has user_id (custom UUID), MongoDB _id excluded
- [x] Session user_id matches user_id
- [x] All queries use {"_id": 0}
- [x] /api/auth/me works with Bearer token AND with session_token cookie
- [x] onboarded=true required for dashboard

## Success
- /api/auth/me returns user data
- /dashboard renders with stats, charts, today's tasks
- All API endpoints return non-401 with Bearer token

## Failure
- 401 anywhere = session/user mismatch — check user_id field

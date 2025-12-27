# College Organizer - Visual Guide

## 📊 Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER IN BROWSER                             │
│                   (http://localhost:3000)                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              REACT FRONTEND (Vite + Tailwind)                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ React Router                                             │  │
│  │  ├─ /login        → Login.jsx                           │  │
│  │  ├─ /register     → Register.jsx                        │  │
│  │  ├─ /dashboard    → Dashboard.jsx (Protected)           │  │
│  │  ├─ /habits       → Habits.jsx (Protected)              │  │
│  │  ├─ /attendance   → Attendance.jsx (Protected)          │  │
│  │  └─ /schedule     → Schedule.jsx (Protected)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AuthContext.jsx                                          │  │
│  │ ├─ user: User or null                                  │  │
│  │ ├─ login(email, password)                              │  │
│  │ ├─ register(name, email, password)                     │  │
│  │ └─ logout()                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Services (API Layer)                                     │  │
│  │ ├─ authService.js (login, register)                    │  │
│  │ ├─ habitService.js (CRUD, stats)                       │  │
│  │ ├─ attendanceService.js (subjects, logging)            │  │
│  │ ├─ scheduleService.js (timetable)                      │  │
│  │ └─ api.js (Axios + token interceptor)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Stores token in: localStorage                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTP/JSON with JWT token
             │ (Axios adds Authorization: Bearer <token>)
             ▼
┌─────────────────────────────────────────────────────────────────┐
│          EXPRESS BACKEND (Node.js + REST API)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Routes (src/routes/)                                     │  │
│  │ ├─ POST   /api/auth/register                           │  │
│  │ ├─ POST   /api/auth/login                              │  │
│  │ ├─ GET    /api/users/me                                │  │
│  │ ├─ POST   /api/habits                                  │  │
│  │ ├─ GET    /api/habits                                  │  │
│  │ ├─ POST   /api/habits/log                              │  │
│  │ ├─ GET    /api/habits/stats                            │  │
│  │ ├─ POST   /api/attendance/subject                      │  │
│  │ ├─ GET    /api/attendance/subjects                     │  │
│  │ ├─ POST   /api/attendance/log                          │  │
│  │ ├─ POST   /api/schedule                                │  │
│  │ ├─ GET    /api/schedule                                │  │
│  │ ├─ GET    /api/schedule/today                          │  │
│  │ └─ POST   /api/schedule/today/mark                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Middleware (src/middleware/)                             │  │
│  │ ├─ CORS enabled                                        │  │
│  │ ├─ JSON parser                                         │  │
│  │ ├─ Morgan logging                                      │  │
│  │ └─ Auth middleware (JWT verification)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Controllers (src/controllers/)                           │  │
│  │ ├─ habitController.js                                  │  │
│  │ ├─ attendanceController.js                             │  │
│  │ └─ scheduleController.js                               │  │
│  │                                                         │  │
│  │ + auth.js in routes for login/register                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Models (src/models/ - Mongoose Schemas)                 │  │
│  │ ├─ User.js                                             │  │
│  │ ├─ Habit.js                                            │  │
│  │ ├─ HabitLog.js                                         │  │
│  │ ├─ Subject.js                                          │  │
│  │ ├─ AttendanceLog.js                                    │  │
│  │ └─ WeeklySchedule.js                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Mongoose ODM
             │ (Document-based queries)
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              MONGODB DATABASE (MongoDB Atlas)                   │
│                                                                 │
│  Collections:                                                   │
│  ├─ users        (email, password, name)                      │
│  ├─ habits       (user_id, title, color)                      │
│  ├─ habitlogs    (user_id, habit_id, date, completed)        │
│  ├─ subjects     (user_id, name, total, attended)            │
│  ├─ attendancelogs (user_id, subject_id, date, status)       │
│  └─ weeklyschedules (user_id, day, time, subject_id)         │
│                                                                 │
│  Indexes:                                                       │
│  ├─ habitlogs: unique(user, habit, date)                      │
│  └─ attendancelogs: unique(user, subject, date)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Marking a Habit Complete

```
User clicks checkbox (Frontend)
        ▼
Dashboard.jsx: toggleHabit(habitId, index)
        ▼
habitService.markCompletion(habitId, date, true)
        ▼
api.post('/habits/log', { habitId, date, completed: true })
        ▼
Axios Interceptor adds Authorization header
        ▼
Backend receives POST /api/habits/log
        ▼
Auth middleware verifies JWT token
        ▼
habitController.markCompletion()
        ▼
HabitLog.findOneAndUpdate()
  { user, habit, date } with upsert: true
        ▼
MongoDB upserts document
        ▼
Backend returns updated HabitLog
        ▼
Frontend receives response
        ▼
Update local state: setTodaysHabits(...)
        ▼
UI renders checkmark ✓
```

---

## 👤 User Journey: First Time User

```
1. Visit http://localhost:3000
   └─ Redirects to /login (no token in localStorage)

2. Click "Register"
   └─ Go to /register

3. Fill form: name, email, password
   └─ Submit → authService.register()

4. Backend:
   └─ Hash password with bcryptjs
   └─ Create User document
   └─ Generate JWT token
   └─ Return { token, user }

5. Frontend:
   └─ Store token in localStorage
   └─ Set user in AuthContext
   └─ Redirect to /dashboard

6. Dashboard loads:
   └─ AuthContext.login() fetches /api/users/me
   └─ Shows empty dashboard
   └─ User can add habits, subjects, schedule

7. User logs out:
   └─ localStorage cleared
   └─ Redirect to /login
```

---

## 📈 Attendance Calculation Flow

```
User logs attendance for a class

Frontend: scheduleService.markClass(scheduleId, date, 'attended')
                ▼
Backend: scheduleController.markTodayClass()
                ▼
1. Get WeeklySchedule by ID
2. Get Subject from schedule
3. Check if AttendanceLog exists for (user, subject, date)
                ▼
   If exists:
   └─ Is it different status?
      ├─ Yes: Adjust Subject counts
      └─ No: Return no change

   If new:
   └─ Increment Subject.totalClasses
                ▼
4. Increment Subject.classesAttended
5. MongoDB auto-calc: percent = (attended / total) * 100
6. Save Subject document
7. Upsert AttendanceLog with status='attended'
                ▼
Frontend:
└─ Receive updated Subject
└─ Refresh subjects list
└─ UI shows new attendance %
```

---

## 🗄️ Database Relationships

```
User (1)
 ├─ Habits (N)
 │  └─ HabitLogs (N per Habit)
 ├─ Subjects (N)
 │  ├─ AttendanceLogs (N per Subject)
 │  └─ WeeklySchedules (N per Subject)
 └─ AttendanceLogs (N)
 └─ WeeklySchedules (N)

Example:
User: "John" (1 user)
 ├─ Habit: "Study 2 hrs" (1 habit)
 │  └─ HabitLog: 2024-01-15, completed=true (1 log per day)
 ├─ Subject: "Data Structures" (1 subject)
 │  ├─ AttendanceLog: 2024-01-15, status=attended
 │  └─ WeeklySchedule: Monday 09:00
 └─ (and more habits, subjects, schedules)
```

---

## 🎨 UI Component Tree

```
App.jsx
├─ AuthProvider
│  └─ AppRoutes
│     ├─ Navbar (if user logged in)
│     └─ Routes
│        ├─ /login → Login.jsx
│        ├─ /register → Register.jsx
│        ├─ /dashboard → ProtectedRoute → Dashboard.jsx
│        │                                └─ Charts (Recharts)
│        ├─ /habits → ProtectedRoute → Habits.jsx
│        │                            ├─ HabitForm
│        │                            └─ HabitStats
│        ├─ /attendance → ProtectedRoute → Attendance.jsx
│        │                                ├─ SubjectForm
│        │                                ├─ SubjectCard
│        │                                │  ├─ ProgressBar
│        │                                │  ├─ PieChart (Recharts)
│        │                                │  └─ StatusBadge
│        │                                └─ ManualLog
│        └─ /schedule → ProtectedRoute → Schedule.jsx
│                                       ├─ AddScheduleForm
│                                       ├─ TodaysClasses
│                                       │  ├─ ClassCard
│                                       │  └─ AttendedButton
│                                       └─ WeeklyTimetable
│                                          └─ DayColumn
```

---

## 📱 Mobile-First Responsive Design

```
Mobile (320px)              Tablet (768px)           Desktop (1024px)
┌──────────┐               ┌──────────────┐         ┌─────────────────┐
│ Navbar   │               │ Navbar       │         │ Navbar          │
├──────────┤               ├──────────────┤         ├─────────────────┤
│          │               │              │         │                 │
│ Card 1   │               │ Card 1 | Crd 2        │ Card 1|Crd 2|Crd3
│ (full)   │               │        |              │        |       |
├──────────┤               ├────────┴──────┤       │        |       |
│          │               │                │       ├────────┴───────┤
│ Card 2   │               │ Card 2         │       │                 │
│ (full)   │               │                │       │ Chart           │
├──────────┤               ├────────────────┤       │                 │
│          │               │                │       └─────────────────┘
│ Card 3   │               │ Card 3         │
│ (full)   │               │                │
└──────────┘               └────────────────┘

Grid: grid-cols-1           grid-cols-1           grid-cols-3
      md:grid-cols-2        md:grid-cols-2        lg:grid-cols-3
      lg:grid-cols-3        lg:grid-cols-3
```

---

## 🔐 Authentication Flow

```
┌─────────────────┐
│  1. User enters │
│  email/password │
└────────┬────────┘
         ▼
┌─────────────────────────────┐
│ 2. Frontend: POST /login    │
│    { email, password }      │
└────────┬────────────────────┘
         ▼
┌─────────────────────────────┐
│ 3. Backend:                 │
│    - Find user by email     │
│    - Compare password with  │
│      bcryptjs.compare()     │
│    - If match: create JWT   │
│    - Return { token, user } │
└────────┬────────────────────┘
         ▼
┌─────────────────────────────┐
│ 4. Frontend:                │
│    - Store token in         │
│      localStorage           │
│    - Redirect to /dashboard │
└────────┬────────────────────┘
         ▼
┌─────────────────────────────┐
│ 5. Protected Requests:      │
│    - Axios interceptor adds │
│      Authorization: Bearer  │
│      <token>               │
└────────┬────────────────────┘
         ▼
┌─────────────────────────────┐
│ 6. Backend Auth Middleware: │
│    - Extract token from     │
│      Authorization header   │
│    - Verify with JWT        │
│    - If valid: proceed      │
│    - If invalid: 401 error  │
└─────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
Development (Local)
────────────────────
localhost:3000 ←→ localhost:5000 ←→ localhost:27017
 (Frontend)       (Backend)         (MongoDB)


Production (Deployed)
─────────────────────
Vercel App    ←→  Render API  ←→  MongoDB Atlas
(your-app           (your-api       (cloud
 .vercel.app)        .onrender.com)   database)

Deployment Flow:
┌──────────────┐
│  Push to     │
│  GitHub      │
└──────┬───────┘
       ├─────────────────────────┬─────────────────────────┐
       ▼                         ▼                         ▼
  Vercel                     Render                  No manual action
  (auto-deploys)          (auto-deploys)            (already configured)
  └─ Builds React          └─ Starts Node           
  └─ Deploys to CDN        └─ Loads from GitHub
  └─ Sets env vars         └─ Sets env vars
       ▼                         ▼
  Frontend live             Backend live


Environment Variables
─────────────────────
Frontend (.env):              Backend (.env):
VITE_API_URL                  PORT
  ↓                             ↓
https://api.onrender.com/api  5000 (Render assigns)

                              MONGO_URI
                                ↓
                              MongoDB Atlas
                              connection

                              JWT_SECRET
                                ↓
                              Secret key
                              for tokens
```

---

## 📊 Data Model Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ _id: ObjectId                                           │   │
│  │ name: String                                            │   │
│  │ email: String (unique)                                  │   │
│  │ password: String (hashed)                               │   │
│  │ createdAt: Date                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│   │                                                             │
│   ├─ (1:N) Habits                                              │
│   │   ├─ Habit 1: "Study 2 hrs"                               │
│   │   ├─ Habit 2: "Workout"                                   │
│   │   └─ Habit 3: "Read"                                      │
│   │                                                             │
│   ├─ (1:N) HabitLogs                                           │
│   │   ├─ 2024-01-15: Habit1=completed                         │
│   │   ├─ 2024-01-15: Habit2=not completed                     │
│   │   └─ 2024-01-16: Habit1=completed                         │
│   │                                                             │
│   ├─ (1:N) Subjects                                            │
│   │   ├─ Data Structures (20 total, 18 attended)              │
│   │   └─ Web Dev (15 total, 14 attended)                      │
│   │                                                             │
│   ├─ (1:N) AttendanceLogs                                      │
│   │   ├─ 2024-01-15: DataStructures=attended                  │
│   │   └─ 2024-01-16: WebDev=missed                            │
│   │                                                             │
│   └─ (1:N) WeeklySchedules                                     │
│       ├─ Monday 09:00: Data Structures                         │
│       ├─ Monday 11:00: Web Dev                                │
│       └─ Wednesday 10:00: Database Design                      │
│                                                             │   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Feature Completeness Checklist

```
Daily Habit Tracker
├─ [✓] Add habits (max 10)
├─ [✓] Daily checkboxes
├─ [✓] Completion logging
├─ [✓] 30-day statistics
└─ [✓] Visual graphs

Class Attendance Tracker
├─ [✓] Add subjects
├─ [✓] Track attendance count
├─ [✓] Auto-calculate percentage
├─ [✓] Color-coded status
├─ [✓] Pie charts
└─ [✓] Manual logging

Weekly Schedule System
├─ [✓] Create timetable
├─ [✓] Add classes by day/time
├─ [✓] Today's class list
├─ [✓] Quick attendance buttons
└─ [✓] Auto-update counts

Dashboard
├─ [✓] Today's habits
├─ [✓] Today's classes
├─ [✓] Overall attendance
└─ [✓] Attendance chart

Authentication
├─ [✓] Registration
├─ [✓] Login
├─ [✓] JWT tokens
├─ [✓] Protected routes
└─ [✓] Logout

UI/UX
├─ [✓] Mobile-first design
├─ [✓] Responsive layout
├─ [✓] Loading states
├─ [✓] Error messages
└─ [✓] Clean navigation

Deployment
├─ [✓] Backend ready (Render)
├─ [✓] Frontend ready (Vercel)
├─ [✓] Environment config
├─ [✓] Seed data script
└─ [✓] Documentation
```

---

This visual guide should help you understand the project structure and data flow!

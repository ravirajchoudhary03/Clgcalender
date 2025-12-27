# Architecture & Technical Design

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│         (Vite + Tailwind + Recharts)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pages: Dashboard, Habits, Attendance, Schedule      │   │
│  │ Auth: Login/Register (JWT-based)                    │   │
│  │ Navigation: Navbar with quick links                 │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/AXIOS
                     │ (JSON + JWT Token)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express Backend                           │
│              (Node.js + REST API)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Routes: /auth, /habits, /attendance, /schedule      │   │
│  │ Controllers: Business logic                         │   │
│  │ Middleware: Auth verification, CORS                 │   │
│  │ Models: Mongoose schemas                            │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ Mongoose
                     │ (Document-based)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 MongoDB Atlas                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Collections: Users, Habits, HabitLogs              │   │
│  │             Subjects, AttendanceLogs               │   │
│  │             WeeklySchedules                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
1. User Registration/Login
   ├─ Frontend: POST /api/auth/register or /api/auth/login
   ├─ Backend: Hash password (bcrypt), create JWT token
   └─ Frontend: Store token in localStorage

2. Authenticated Requests
   ├─ Axios interceptor adds: Authorization: Bearer <token>
   ├─ Backend auth middleware verifies token
   ├─ If valid: req.user populated, proceed
   └─ If invalid: return 401 Unauthorized

3. Logout
   └─ Frontend: Clear localStorage, redirect to login

4. Token Expiry
   ├─ Token expires in 7 days
   ├─ User must re-login
   └─ Future: Add refresh token rotation
```

## Data Flow Examples

### Marking a Habit as Complete

```
Frontend (Dashboard.jsx)
  ├─ User clicks checkbox
  ├─ toggleHabit(habitId, index) called
  └─ habitService.markCompletion(habitId, date, true)
                      ▼
habitService (habitService.js)
  └─ api.post('/habits/log', { habitId, date, completed })
                      ▼
Axios Interceptor
  └─ Adds Authorization header with token
                      ▼
Backend Route (routes/habits.js)
  └─ POST /habits/log
                      ▼
Auth Middleware
  ├─ Verify JWT token
  └─ Attach req.user
                      ▼
Controller (habitController.js)
  ├─ habitId, date, completed from body
  ├─ Call HabitLog.findOneAndUpdate()
  │  (upsert: true - creates if not exists)
  └─ Return updated log
                      ▼
MongoDB
  ├─ User has HabitLog for habit X on date Y
  └─ Set completed = true
                      ▼
Backend Response
  └─ JSON response with updated log
                      ▼
Frontend
  ├─ Receive response
  ├─ Update local state
  └─ UI shows checkmark
```

### Logging Attendance & Updating Subject

```
Frontend (Schedule.jsx)
  ├─ User clicks "Attended" for class
  ├─ markClass(scheduleId, 'attended') called
  └─ scheduleService.markClass(scheduleId, date, 'attended')
                      ▼
Backend Controller (scheduleController.js)
  ├─ Get WeeklySchedule entry
  ├─ Get Subject from schedule
  ├─ Check if AttendanceLog exists for (user, subject, date)
  │  ├─ If exists: adjust Subject counts
  │  └─ If new: increment totalClasses
  ├─ Increment classesAttended
  ├─ Save Subject (auto-calc: percent = attended/total)
  ├─ Upsert AttendanceLog with status='attended'
  └─ Return updated subject
                      ▼
MongoDB
  ├─ Subject updated: classesAttended++
  ├─ Subject updated: totalClasses++ (if new)
  └─ AttendanceLog created/updated
                      ▼
Frontend
  ├─ Receive updated subject
  ├─ Refresh subjects list
  └─ UI shows updated attendance %
```

## Component Architecture

### Page Components (src/pages/)
- **Dashboard.jsx**: Main overview, fetches all data, renders cards + chart
- **Habits.jsx**: Add habits, select habit, view 30-day stats
- **Attendance.jsx**: Add subjects, view pie/bar charts, log manually
- **Schedule.jsx**: Manage weekly timetable, today's quick buttons

### Reusable Components (src/components/)
- **Navbar.jsx**: Top navigation with links and logout
- **ProtectedRoute.jsx**: Wrapper to check auth before rendering page

### Services (src/services/)
- **api.js**: Axios instance with auth interceptor
- **authService.js**: Login, register, getMe
- **habitService.js**: CRUD habits, mark completion, stats
- **attendanceService.js**: CRUD subjects, log attendance
- **scheduleService.js**: Add schedule, list, today's classes, mark

### Context (src/context/)
- **AuthContext.jsx**: Manages user, login, register, logout, loading/error states

## Backend Architecture

### Entry Point (src/index.js)
- Express app setup
- Middleware: CORS, JSON parser, Morgan logging
- Database connection
- Route mounting
- Server listen

### Middleware (src/middleware/auth.js)
- Extract token from Authorization header
- Verify JWT with secret
- Attach user to request
- Return 401 if invalid

### Models (src/models/)
- User: Email, password (hashed), name
- Habit: Title, color, user reference
- HabitLog: Date, habit, completion status (compound index on user+habit+date)
- Subject: Name, color, attendance counts
- AttendanceLog: Date, subject, status (compound index)
- WeeklySchedule: Day, time, subject

### Controllers (src/controllers/)
- habitController: createHabit, getHabits, markCompletion, getStats
- attendanceController: createSubject, listSubjects, logAttendance
- scheduleController: addSchedule, getSchedule, getTodaysClasses, markTodayClass

### Routes (src/routes/)
- auth.js: Register, Login
- habits.js: CRUD + stats
- attendance.js: CRUD + logging
- schedule.js: CRUD + today + mark
- users.js: Get current user

## Database Design

### Collections & Relationships

```
Users (1)
  ├─ (1:N) Habits
  ├─ (1:N) HabitLogs
  ├─ (1:N) Subjects
  ├─ (1:N) AttendanceLogs
  └─ (1:N) WeeklySchedules

Habits (1)
  └─ (1:N) HabitLogs

Subjects (1)
  ├─ (1:N) AttendanceLogs
  └─ (1:N) WeeklySchedules
```

### Indexes
- HabitLog: `{ user, habit, date }` unique
- AttendanceLog: `{ user, subject, date }` unique
- (Prevents duplicate logging)

## Performance Considerations

### Current Optimizations
- Compound indexes on frequently queried fields
- `lean()` queries where mutations not needed
- Batch Promise.all() for parallel API calls
- Tailwind for minimal CSS (~50KB gzipped)
- Recharts lazy-loaded charts

### For Scale (1000+ users)
1. **Caching**: Add Redis for user/habit cache
2. **Aggregation**: Use MongoDB aggregation pipeline for stats
3. **Pagination**: Add limit/offset to list endpoints
4. **CDN**: Serve frontend assets via Vercel/Cloudflare
5. **API Rate Limiting**: Express rate-limit package
6. **Query Optimization**: Add indexes for common filters

## Security

### Implemented
- ✅ Password hashing (bcryptjs)
- ✅ JWT authentication
- ✅ Protected routes (backend + frontend)
- ✅ CORS enabled
- ✅ Environment variables for secrets

### Future Improvements
- Add input validation (joi/zod)
- HTTPS only in production
- Refresh token rotation
- Rate limiting on auth endpoints
- CSRF tokens
- Data encryption at rest

## Error Handling

### Frontend
- Try-catch blocks around API calls
- Axios error interception
- User-friendly error messages
- Loading states during async ops

### Backend
- Try-catch in controllers
- 400 for bad input
- 401 for auth failures
- 404 for not found
- 500 for server errors
- Morgan logging all requests

## Testing Strategy (Not Implemented)

For production app, add:
1. **Unit Tests**: Jest for services/controllers
2. **Integration Tests**: Supertest for API routes
3. **E2E Tests**: Cypress for user flows
4. **Seed Data**: Populate realistic test data

Example command:
```bash
npm test
npm run test:integration
npm run test:e2e
```

## Deployment Architecture

```
Development
  └─ Localhost (port 3000 + 5000)

Staging (Optional)
  ├─ Frontend: Vercel Preview
  └─ Backend: Render Preview

Production
  ├─ Frontend: Vercel Production
  │  └─ Deployed via git push → main
  ├─ Backend: Render Production
  │  └─ Deployed via git push → main
  └─ Database: MongoDB Atlas
     └─ Auto-backup snapshots
```

## Scalability Path

```
Phase 1 (Current): Single user per session
  ├─ OK for ~100 daily active users
  └─ Database: 512MB (Atlas free tier)

Phase 2 (Next): Multi-tenant with shared resources
  ├─ Add user quotas
  ├─ Implement data isolation
  └─ Monitor usage per user

Phase 3 (Growth): Dedicated infrastructure
  ├─ Custom backend cluster (AWS/GCP)
  ├─ MongoDB sharding
  ├─ Redis session store
  └─ CDN for frontend

Phase 4 (Enterprise): Microservices
  ├─ Separate services per domain
  ├─ Message queue (RabbitMQ)
  ├─ Advanced analytics
  └─ Admin dashboard
```

## Folder Structure Explained

### Backend
```
backend/
├── src/
│   ├── config/          Database connection setup
│   ├── controllers/     Request handlers (business logic)
│   ├── middleware/      Utilities like auth
│   ├── models/          Data schemas
│   ├── routes/          API endpoint definitions
│   └── index.js         Express app entry
├── scripts/
│   └── seed.js          Demo data generation
├── package.json         Dependencies
├── .env.example         Template with placeholders
└── README.md            API documentation
```

### Frontend
```
frontend/
├── src/
│   ├── components/      Reusable UI components
│   ├── pages/           Full-page components
│   ├── services/        API client wrappers
│   ├── context/         Global state (Auth)
│   ├── App.jsx          Routes & layout
│   ├── App.css          Global styles
│   └── main.jsx         React root
├── index.html           Entry HTML
├── vite.config.js       Build config
├── tailwind.config.js   Tailwind config
├── postcss.config.js    CSS processing
├── package.json         Dependencies
├── .env.example         API URL template
└── README.md            UI documentation
```

## Key Design Decisions

1. **JWT over Sessions**: Stateless, easier to scale
2. **MongoDB over SQL**: Flexible schema, easier for students
3. **React Context over Redux**: Simpler for small app, less boilerplate
4. **Tailwind over CSS Modules**: Faster development, consistent design
5. **Mongoose over raw driver**: Type safety and validation
6. **Vite over Create React App**: Faster builds, modern tooling
7. **Separate frontend/backend repos**: Independent scaling/deployment

## Common Questions

**Q: Why separate frontend and backend?**
- Independent scaling
- Can deploy to different platforms (Vercel vs Render)
- Cleaner separation of concerns
- Easier for team collaboration

**Q: Why compound indexes on logs?**
- Prevent duplicate entries for same user/habit/date
- Fast lookups for daily checks
- Unique constraint handles edge cases

**Q: Why Recharts over Chart.js?**
- React component-based
- Better TypeScript support
- Composable and customizable
- Lighter bundle size

**Q: How to handle offline?**
- Not currently implemented
- Could add Service Workers + localStorage queue
- When online: sync queued changes to backend

**Q: How to export data?**
- Add CSV export endpoint in backend
- Frontend calls endpoint to download
- Useful for student records

## Future Enhancements

1. Offline support (Service Workers)
2. Notifications (browser push)
3. Recurring habits (weekly/monthly)
4. Goals and streaks
5. Social features (friend's goals)
6. Mobile app (React Native)
7. Email reminders
8. Analytics dashboard
9. Data export (CSV)
10. Habit templates (premade habits)

---

This architecture is designed for clarity, scalability, and educational value. Each layer has a clear responsibility, making it easy for students to understand and extend.

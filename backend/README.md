# College Organizer Backend

Full-stack backend for managing daily habits, class attendance, and weekly schedules.

## Tech Stack
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **Additional**: CORS, Morgan for logging, dotenv for config

## Setup

### 1. Clone and Install
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update:
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/college-organizer?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_change_this
```

**For local MongoDB (optional):**
```
MONGO_URI=mongodb://localhost:27017/college-organizer
```

### 3. Seed Data (Optional)
```bash
npm run seed
# Test credentials: student@example.com / password123
```

### 4. Run Server
```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

All protected routes require: `Authorization: Bearer <token>`

### Auth (Public)
- `POST /api/auth/register` - { name, email, password }
- `POST /api/auth/login` - { email, password }

### Users (Protected)
- `GET /api/users/me` - Get current user

### Habits (Protected)
- `POST /api/habits` - Create habit { title, color }
- `GET /api/habits` - List user's habits
- `POST /api/habits/log` - Mark completion { habitId, date, completed }
- `GET /api/habits/stats?habitId=X&start=YYYY-MM-DD&end=YYYY-MM-DD` - Get stats

### Attendance (Protected)
- `POST /api/attendance/subject` - Create subject { name, color }
- `GET /api/attendance/subjects` - List subjects with percentage
- `POST /api/attendance/log` - Log attendance { subjectId, date, status }

### Schedule (Protected)
- `POST /api/schedule` - Add schedule entry { day, time, subjectId }
- `GET /api/schedule` - Get user's schedule
- `GET /api/schedule/today` - Get today's classes
- `POST /api/schedule/today/mark` - Mark today's class { scheduleId, date, status }

## Data Models

### User
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
```

### Habit
```
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  title: String,
  color: String,
  createdAt: Date
}
```

### HabitLog
```
{
  _id: ObjectId,
  user: ObjectId,
  habit: ObjectId (ref: Habit),
  date: String (YYYY-MM-DD),
  completed: Boolean
}
```

### Subject
```
{
  _id: ObjectId,
  user: ObjectId,
  name: String,
  totalClasses: Number,
  classesAttended: Number,
  color: String
}
```

### AttendanceLog
```
{
  _id: ObjectId,
  user: ObjectId,
  subject: ObjectId,
  date: String (YYYY-MM-DD),
  status: String (attended | missed)
}
```

### WeeklySchedule
```
{
  _id: ObjectId,
  user: ObjectId,
  day: String (Mon-Sun),
  time: String (HH:MM),
  subject: ObjectId (ref: Subject)
}
```

## Deployment (Render)

1. Push code to GitHub
2. Connect repo to Render
3. Set environment variables in Render dashboard
4. Deploy

## Notes
- Passwords are hashed with bcrypt
- JWTs expire in 7 days
- Date format: YYYY-MM-DD (ISO)
- All endpoints return JSON
- CORS enabled for frontend

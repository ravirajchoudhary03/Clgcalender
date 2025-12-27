# College Organizer - Full Stack Application

A beginner-friendly web app for college students to manage daily habits, track class attendance, and manage weekly schedules.

**Live Demo Credentials:**
- Email: `student@example.com`
- Password: `password123`

## Project Structure

```
calender/
├── backend/              # Express + MongoDB backend
│   ├── src/
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API endpoints
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth, CORS, etc
│   │   ├── config/       # Database connection
│   │   └── index.js      # Server entry
│   ├── scripts/
│   │   └── seed.js       # Sample data
│   ├── package.json
│   └── README.md
└── frontend/             # React + Vite frontend
    ├── src/
    │   ├── pages/        # Page components
    │   ├── components/   # Reusable components
    │   ├── services/     # API layer
    │   ├── context/      # React Context
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── README.md
```

## Quick Start

### Prerequisites
- Node.js 14+
- MongoDB (local or MongoDB Atlas)
- Git

### Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create .env
cp .env.example .env

# 3. Configure .env
# Edit .env with your MongoDB URI and JWT secret
cat .env
# PORT=5000
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/college-organizer
# JWT_SECRET=your_secret_key_here

# 4. Seed database (optional, creates demo data)
npm run seed

# 5. Start server
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create .env
cp .env.example .env

# 3. (Optional) Update .env if backend is on different URL
# Default: VITE_API_URL=http://localhost:5000/api

# 4. Start dev server
npm run dev
# App runs on http://localhost:3000
```

Visit `http://localhost:3000` and login with demo credentials.

## MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. Go to [mongodb.com/cloud](https://www.mongodb.com/cloud/atlas)
2. Create account and free cluster
3. Whitelist your IP
4. Get connection string: `mongodb+srv://username:password@cluster0.mongodb.net/college-organizer`
5. Paste into `.env` as `MONGO_URI`

### Option 2: Local MongoDB

```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod

# Connection string
MONGO_URI=mongodb://localhost:27017/college-organizer
```

## API Endpoints

### Authentication (Public)
```
POST   /api/auth/register     { name, email, password }
POST   /api/auth/login        { email, password }
```

### Users (Protected)
```
GET    /api/users/me          Get current user
```

### Habits (Protected)
```
POST   /api/habits            { title, color } - Create habit
GET    /api/habits            List user's habits
POST   /api/habits/log        { habitId, date, completed } - Mark completion
GET    /api/habits/stats?habitId=X&start=YYYY-MM-DD&end=YYYY-MM-DD
```

### Attendance (Protected)
```
POST   /api/attendance/subject           { name, color }
GET    /api/attendance/subjects          List with percentage
POST   /api/attendance/log               { subjectId, date, status }
```

### Schedule (Protected)
```
POST   /api/schedule                     { day, time, subjectId }
GET    /api/schedule                     Get weekly schedule
GET    /api/schedule/today               Get today's classes
POST   /api/schedule/today/mark          { scheduleId, date, status }
```

**All protected routes require:**
```
Authorization: Bearer <jwt_token>
```

## Features

### 1. Daily Habit Tracker
- Add up to 10 daily habits
- Daily checkbox completion
- 30-day completion stats
- Visual percentage tracking

### 2. Class Attendance Tracker
- Add subjects with progress tracking
- Auto-calculate attendance percentage
- Color-coded status:
  - 🟢 Green: ≥75% (Good)
  - 🟡 Yellow: 65-74% (At Risk)
  - 🔴 Red: <65% (Critical)
- Pie & bar charts

### 3. Weekly Schedule
- Add classes for each day (Mon-Sun)
- Auto-generate today's class list
- Quick Attended/Missed buttons
- Automatic attendance logging

### 4. Dashboard
- Today's habits checklist
- Today's classes overview
- Overall attendance percentage
- Attendance bar chart

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
```

### Habit
```javascript
{
  user: ObjectId,
  title: String,
  color: String (hex),
  createdAt: Date
}
```

### HabitLog
```javascript
{
  user: ObjectId,
  habit: ObjectId,
  date: String (YYYY-MM-DD),
  completed: Boolean
}
```

### Subject
```javascript
{
  user: ObjectId,
  name: String,
  totalClasses: Number,
  classesAttended: Number,
  color: String (hex)
}
```

### AttendanceLog
```javascript
{
  user: ObjectId,
  subject: ObjectId,
  date: String (YYYY-MM-DD),
  status: String (attended|missed)
}
```

### WeeklySchedule
```javascript
{
  user: ObjectId,
  day: String (Mon-Sun),
  time: String (HH:MM),
  subject: ObjectId
}
```

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Connect GitHub repo
4. Create Web Service
5. Set environment variables:
   ```
   PORT=5000
   MONGO_URI=<your_mongodb_connection>
   JWT_SECRET=<your_secret>
   ```
6. Deploy

Get backend URL: `https://your-backend.onrender.com`

### Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo (frontend folder)
3. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
4. Deploy

Frontend auto-deploys on push to main.

## Code Quality

### File Organization
- **Services**: API calls (`/services`)
- **Components**: Reusable UI (`/components`)
- **Pages**: Full-page components (`/pages`)
- **Context**: Global state (`/context`)
- **Controllers**: Business logic (`src/controllers`)
- **Models**: Data schemas (`src/models`)
- **Routes**: API endpoints (`src/routes`)

### Key Patterns
- Clean separation of concerns
- Reusable service layer for API
- React Context for auth state
- Protected routes for auth
- Error handling throughout
- Loading states on async operations

### No Unnecessary Libraries
- Axios for HTTP (lightweight)
- Recharts for charts (composable)
- Tailwind for styling (utility classes)
- dayjs for dates (smaller than moment)

## Troubleshooting

### Backend
**MongoDB Connection Error**
- Check `MONGO_URI` in `.env`
- Whitelist IP in MongoDB Atlas

**Port 5000 already in use**
```bash
# Change PORT in .env or kill process
lsof -i :5000
kill -9 <PID>
```

### Frontend
**CORS Error**
- Backend must have `cors()` middleware
- Check `VITE_API_URL` matches backend

**Can't login?**
- Run backend seed: `npm run seed`
- Check demo creds: `student@example.com / password123`

**Blank page?**
- Check browser console for errors
- Verify backend is running

### General
**Clear local state**
```javascript
// In browser console
localStorage.clear()
```

## Development Tips

### Add a New Page
1. Create component in `frontend/src/pages/`
2. Add route in `App.jsx`
3. Add navigation link in `Navbar.jsx`
4. Use service layer for API calls

### Add a New API Endpoint
1. Create controller in `backend/src/controllers/`
2. Create route in `backend/src/routes/`
3. Wire in `backend/src/index.js`
4. Create service in `frontend/src/services/`

### Test API Manually
```bash
# Get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# Use token to call protected endpoint
curl -X GET http://localhost:5000/api/habits \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## License

Open source. Free to use and modify.

## Support

For issues, check:
1. `.env` configuration
2. Backend `.env.example` for required variables
3. Frontend `.env.example` for API URL
4. MongoDB connection string
5. Backend running on port 5000
6. Frontend running on port 3000

# College Organizer - Frontend

React + Vite web app for managing daily habits, class attendance, and weekly schedules.

## Tech Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP**: Axios
- **Date**: dayjs

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` or `.env.local`:
```bash
cp .env.example .env
```

Update `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

For production (Vercel):
```
VITE_API_URL=https://your-backend.onrender.com/api
```

### 3. Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

### 4. Build for Production
```bash
npm run build
npm run preview
```

## Features

### Dashboard
- Today's habits checklist
- Today's classes
- Overall attendance percentage
- Attendance bar chart

### Habits
- Add up to 10 daily habits
- Daily checkboxes
- 30-day completion stats
- Completion percentage

### Attendance
- Manage subjects
- Track attended vs missed classes
- Color-coded attendance status:
  - Green: ≥75% (Good)
  - Yellow: 65-74% (At Risk)
  - Red: <65% (Critical)
- Progress bars and pie charts

### Schedule
- Weekly timetable
- Add classes for each day
- Today's class list with Attended/Missed buttons
- Quick attendance logging

## Project Structure

```
src/
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Habits.jsx
│   ├── Attendance.jsx
│   └── Schedule.jsx
├── components/
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx
├── services/
│   ├── api.js (axios instance)
│   ├── authService.js
│   ├── habitService.js
│   ├── attendanceService.js
│   └── scheduleService.js
├── context/
│   └── AuthContext.jsx
├── App.jsx
├── main.jsx
└── App.css
```

## API Integration

All API calls go through service layer (`src/services/`). Each service wraps API endpoints with proper error handling.

**Auth Flow:**
1. Register/Login → get JWT token
2. Store token in localStorage
3. Axios interceptor adds token to all requests
4. ProtectedRoute checks auth state

## Authentication

- Email + password registration/login
- JWT stored in localStorage
- Token auto-sent in `Authorization: Bearer` header
- Demo credentials: `student@example.com / password123`

## Deployment (Vercel)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variable: `VITE_API_URL`
4. Deploy

Vercel auto-builds and deploys on push to main branch.

## Mobile-First Design

All components are designed mobile-first:
- Responsive grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Flex layouts with `flex-wrap`
- Touch-friendly buttons (larger tap targets)
- Readable fonts on small screens

## Troubleshooting

**CORS Error?**
- Backend must have `cors()` enabled
- Check `VITE_API_URL` matches backend URL

**Token Issues?**
- Clear localStorage and re-login
- Check JWT secret matches between frontend and backend

**Charts not showing?**
- Install recharts: `npm install recharts`

## Notes
- All dates are ISO format (YYYY-MM-DD)
- Token expires in 7 days
- Auto-logout not implemented (session persists until manual logout)

# College Organizer 📚

A complete, production-ready web application for college students to manage daily habits, track class attendance, and organize weekly schedules.

**Built by a first-year engineering student, for first-year engineering students.**

## Features

✅ **Daily Habit Tracker** - Track up to 10 habits with daily checkboxes and 30-day stats
✅ **Class Attendance Tracker** - Monitor attendance % with color-coded status
✅ **Weekly Schedule** - Manage timetable and log attendance quickly
✅ **Beautiful Dashboard** - Real-time overview of habits, classes, and attendance
✅ **Charts & Graphs** - Visual insights with Recharts
✅ **Mobile-First Design** - Perfect on phone, tablet, or desktop
✅ **Production Ready** - Deploy to Vercel + Render in minutes

## Quick Links

- **[Setup Guide](./SETUP.md)** - Local development & environment setup
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to Vercel & Render
- **[Backend README](./backend/README.md)** - API documentation
- **[Frontend README](./frontend/README.md)** - UI component docs

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS (styling)
- Recharts (charts)
- Axios (HTTP)
- dayjs (dates)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcryptjs (password hashing)

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Getting Started (5 minutes)

### 1. Clone & Install
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure .env files
```bash
# backend/.env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/college-organizer
JWT_SECRET=your_secret_here

# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Both Servers
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 4. Open & Login
Visit `http://localhost:3000`

**Demo credentials:**
```
Email: student@example.com
Password: password123
```

(Credentials available after running `npm run seed`)

## Project Structure

```
calender/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API endpoints
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, CORS, validation
│   │   └── index.js         # Express server
│   ├── scripts/seed.js      # Example data
│   └── README.md            # Backend docs
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Full-page components
│   │   ├── components/      # Reusable UI
│   │   ├── services/        # API layer
│   │   ├── context/         # Auth context
│   │   └── App.jsx          # Main app
│   ├── index.html
│   └── README.md            # Frontend docs
│
├── SETUP.md                 # Development setup
├── DEPLOYMENT.md            # Production deployment
└── README.md               # This file
```

## Data Models

### User Model
- Name, Email, Password (hashed)
- Timestamps

### Habit Model
- Title, Color, User reference
- Stores habit definition (e.g., "Study 2 hrs")

### HabitLog Model
- Date, Habit reference, Completion status
- Tracks daily completion

### Subject Model
- Name, Color, Classes attended/total
- Auto-calculated percentage

### AttendanceLog Model
- Date, Subject reference, Status (attended/missed)
- Audit trail of attendance

### WeeklySchedule Model
- Day (Mon-Sun), Time, Subject reference
- User's timetable

## API Overview

All API endpoints return JSON and require `Authorization: Bearer <token>` header (except auth endpoints).

```
POST   /api/auth/register              Create account
POST   /api/auth/login                 Get JWT token
GET    /api/users/me                   Get current user

POST   /api/habits                     Create habit
GET    /api/habits                     List habits
POST   /api/habits/log                 Mark completion
GET    /api/habits/stats               Get stats

POST   /api/attendance/subject         Create subject
GET    /api/attendance/subjects        List subjects
POST   /api/attendance/log             Log attendance

POST   /api/schedule                   Add schedule
GET    /api/schedule                   Get schedule
GET    /api/schedule/today             Today's classes
POST   /api/schedule/today/mark        Quick attendance
```

## Key Features Explained

### Habit Tracker
- Add up to 10 daily habits
- Check off each day
- See 30-day completion %
- Visual progress on dashboard

### Attendance Tracker
- Add subjects/classes
- Track attended vs total
- Auto-calculate percentage
- Color indicators:
  - 🟢 Green: ≥75%
  - 🟡 Yellow: 65-74%
  - 🔴 Red: <65%

### Schedule & Quick Logging
- Create weekly timetable
- Today's classes auto-load
- One-click Attended/Missed buttons
- Attendance auto-updates

### Dashboard
- Today's habit checklist
- Today's classes
- Overall attendance %
- Visual charts

## Code Quality

### Clean Architecture
- Separation of concerns
- Reusable components
- Service layer for API
- Protected routes for auth

### Best Practices
- Error handling throughout
- Loading states on async ops
- Environment variables for config
- Comments explaining logic
- No unnecessary libraries

### Performance
- Lazy routing
- Efficient API calls
- Optimized re-renders
- Tailwind for lightweight CSS

## Deployment

### Production Checklist

```
Backend (Render):
☐ Push code to GitHub
☐ Connect Render to GitHub
☐ Set MONGO_URI, JWT_SECRET
☐ Deploy & test API

Frontend (Vercel):
☐ Set VITE_API_URL to backend URL
☐ Deploy & test login

Post-Deploy:
☐ Run seed data
☐ Test full user flow
☐ Share with friends!
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps.

**Estimated time: 15 minutes**

## Common Tasks

### Add a New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Add navigation link
4. Call API via service layer

### Add New API Endpoint
1. Create controller in `backend/src/controllers/`
2. Create route in `backend/src/routes/`
3. Import route in `backend/src/index.js`
4. Create service in `frontend/src/services/`

### Debug API Issues
```bash
# Check backend running
curl http://localhost:5000/

# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# Check token works
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to MongoDB | Check MONGO_URI in .env, verify IP whitelisted in Atlas |
| CORS error | Ensure backend cors() is enabled, check VITE_API_URL |
| Blank login page | Check browser console, verify backend running |
| Can't log in | Run `npm run seed` to create demo user |
| Charts not showing | Verify Recharts installed: `npm list recharts` |

## Learning Resources

### Concepts Covered
- React hooks (useState, useEffect, useContext)
- JWT authentication
- MongoDB/Mongoose schemas
- Express API routes
- REST principles
- Protected routes
- Error handling
- Environment variables

### Recommended Reading
- [React Docs](https://react.dev)
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Docs](https://docs.mongodb.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Performance Notes

### Optimizations Implemented
- ✅ Lazy component loading
- ✅ Efficient API calls (batched requests)
- ✅ Tailwind for minimal CSS
- ✅ Recharts for interactive charts
- ✅ Protected routes prevent unauthorized renders
- ✅ Token-based auth (stateless)

### For Scale (1000+ users)
- Add Redis caching
- Use CDN for frontend
- Add API rate limiting
- Optimize DB queries with indexes
- Consider session management

## Contributing

Found a bug? Want to improve?

1. Fork the repo
2. Create a feature branch
3. Make changes
4. Test locally
5. Submit pull request

## License

Open source. Free to use, modify, and deploy.

## Support

Stuck? Check:
1. [SETUP.md](./SETUP.md) for configuration
2. [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting
3. Backend [README.md](./backend/README.md) for API docs
4. Frontend [README.md](./frontend/README.md) for component docs

## Author

Built by a first-year engineering student with a passion for clean code and helping others learn full-stack development.

---

**Happy organizing! 🎓**

Questions? Open an issue or reach out.

# 🚀 QUICK FIX GUIDE - Calendar Sync Issue

**Time to fix:** ~5 minutes  
**Status:** Ready to deploy  
**Last updated:** 2024

---

## 🎯 THE PROBLEM

**Classes appear in Schedule page but NOT on Dashboard calendar.**

**Root Cause:** Schedule page was using `WeeklySchedule` (old system), Dashboard was using `ClassInstance` (new system). Two different databases = no sync!

---

## ✅ THE SOLUTION (3 STEPS)

### STEP 1: Run the Migration Script

This moves your existing schedule data to the correct system.

```bash
cd backend
node src/scripts/migrateSchedule.js
```

**What it does:**
- Reads old `WeeklySchedule` entries
- Adds them to `Subject.schedule` (the new system)
- Generates `ClassInstance` records for next 4 weeks
- Reports what was migrated

**Expected output:**
```
✅ Migration completed successfully!
   - Migrated X schedule entries
   - Updated Y subjects
   - Generated ClassInstances for next 4 weeks
```

---

### STEP 2: Restart Backend Server

Kill the old server and start fresh to load the updated code.

```bash
# Kill existing process (if running)
# Windows:
taskkill /F /IM node.exe

# macOS/Linux:
pkill -f "node"

# Start backend
cd backend
npm start
```

**You should see:**
```
✅ MongoDB connected
✅ Server running on port 5000
```

---

### STEP 3: Restart Frontend

```bash
# In a new terminal
cd frontend
npm run dev
```

**You should see:**
```
VITE ready in X ms
Local: http://localhost:5173/
```

---

## 🧪 VERIFY IT'S WORKING

### Test 1: Check Dashboard Calendar
1. Open http://localhost:5173
2. Login
3. Go to Dashboard
4. **✅ Verify:** Classes appear in the calendar
5. **✅ Verify:** "Today's Classes" section shows classes (if any today)

### Test 2: Add New Schedule Entry
1. Go to Schedule page
2. Add a new class (e.g., "Test Subject" on Monday at 10:00)
3. Go back to Dashboard
4. Navigate to next Monday on calendar
5. **✅ Verify:** "Test Subject" appears on Monday at 10:00

### Test 3: Mark Attendance
1. On Dashboard, find a class for today
2. Mark it as "Attended" or "Missed"
3. **✅ Verify:** Calendar cell color updates
4. **✅ Verify:** Attendance % updates on Attendance page

---

## 🔍 STILL NOT WORKING?

### Run Diagnostics

```bash
cd backend
node src/scripts/diagnose.js
```

This will tell you exactly what's wrong:
- Missing ClassInstances?
- Old WeeklySchedule data still present?
- Subjects with no schedules?

**Follow the recommendations in the diagnostic output.**

---

## 🆘 COMMON ISSUES & FIXES

### Issue: "Cannot find module"
```bash
cd backend
npm install
```

### Issue: "Connection refused" (MongoDB not running)
```bash
# Start MongoDB
# Windows: Start MongoDB service from Services
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Issue: "No classes today" but schedule exists
```bash
# Force regenerate ClassInstances via API
curl -X POST http://localhost:5000/api/schedule/regenerate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or add a new schedule entry on Schedule page (auto-generates)
```

### Issue: Still seeing old data
```bash
# Clear browser cache
# Chrome: Ctrl+Shift+Delete → Clear cached images and files
# Or use Incognito mode: Ctrl+Shift+N
```

---

## 📊 WHAT CHANGED?

### Backend Changes
- ✅ `scheduleController.js` - Now uses `Subject.schedule` + auto-generates `ClassInstance`
- ✅ `addSchedule()` - Adds to Subject.schedule and creates ClassInstances
- ✅ `getTodaysClasses()` - Reads from ClassInstance (with auto-generation)
- ✅ `markTodayClass()` - Updates ClassInstance.status

### Migration Script
- ✅ `migrateSchedule.js` - Converts old WeeklySchedule to new system

### No Frontend Changes Needed
- Dashboard was already using ClassInstance (correct!)
- Schedule page API calls remain the same (backend handles the change)

---

## 🎓 HOW IT WORKS NOW

```
┌─────────────────────────────────────┐
│  USER: Add Monday 9:00 AM class     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Subject.schedule (Rules)           │
│  [{day:"Mon", time:"09:00"}]        │
└─────────────┬───────────────────────┘
              │ Auto-generates ↓
              ▼
┌─────────────────────────────────────┐
│  ClassInstance (Actual Classes)     │
│  - Dec 16 Mon 09:00 [pending]       │
│  - Dec 23 Mon 09:00 [pending]       │
│  - Dec 30 Mon 09:00 [pending]       │
│  - Jan 06 Mon 09:00 [pending]       │
└─────────────┬───────────────────────┘
              │ Displayed on ↓
              ▼
┌─────────────────────────────────────┐
│  Dashboard Calendar + Today's List  │
└─────────────────────────────────────┘
```

**ONE source of truth → ONE place to display → Always in sync!**

---

## 📝 POST-FIX CHECKLIST

After applying the fix, confirm:

- [ ] Migration script ran successfully
- [ ] Backend server restarted
- [ ] Frontend dev server restarted
- [ ] Dashboard calendar shows classes
- [ ] Today's Classes section populated (if classes today)
- [ ] Adding new schedule entry appears on Dashboard
- [ ] Marking attendance updates calendar color
- [ ] Week navigation works correctly
- [ ] Diagnostic script shows no critical issues

---

## 🎉 SUCCESS!

You'll know it's working when:
1. ✅ Classes from Schedule page appear on Dashboard
2. ✅ Calendar and "Today's Classes" show same data
3. ✅ No more "0 classes today" when schedule exists
4. ✅ Attendance marking updates calendar instantly

---

## 📚 FURTHER READING

- **Detailed explanation:** See `SCHEDULE_SYNC_FIX.md`
- **Script documentation:** See `backend/src/scripts/README.md`
- **Architecture overview:** See `ARCHITECTURE.md`

---

## 💡 PREVENTION

To avoid this issue in future:
1. ✅ Always use ONE source of truth for data
2. ✅ Never create parallel systems for the same data
3. ✅ Auto-generate derived data (don't store it twice)
4. ✅ Run diagnostic script regularly
5. ✅ Test end-to-end: Add → Display → Update → Verify

---

**Fixed by:** Senior Full-Stack Engineer  
**Date:** 2024  
**Status:** ✅ PRODUCTION READY

**Need help?** Run `node src/scripts/diagnose.js` for detailed analysis.
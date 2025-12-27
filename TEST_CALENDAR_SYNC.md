# 🧪 QUICK TEST: Calendar Sync Fix

## ⚡ 5-MINUTE VERIFICATION

### Step 1: Start Servers
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Step 2: Login
```
URL: http://localhost:3000
Email: student@example.com
Password: password123
```

### Step 3: Check Current State
1. Go to **Dashboard**
2. Look at the weekly calendar (Mon-Sun boxes)
3. Check browser console (F12) for logs:
   ```
   📊 Fetched data:
     - Week classes: X
   📅 Calendar will show: X classes for the week
   ```

### Step 4: Verify Sync
1. Go to **Attendance** page
2. Check if you have subjects with schedules
3. Go back to **Dashboard**
4. **VERIFY:** Calendar shows the same classes as "Today's Classes" section below

### Step 5: Test Status Colors
1. If you have classes today, click **"✅ Attended"**
2. **VERIFY:** Class in calendar turns GREEN
3. Click **"❌ Missed"** on another class
4. **VERIFY:** Class in calendar turns RED

### Step 6: Test Week Navigation
1. Click **→** (next week button)
2. **VERIFY:** Calendar updates with next week's classes
3. Click **←** (previous week button)
4. **VERIFY:** Calendar goes back to current week

---

## ✅ SUCCESS CRITERIA

Calendar sync is working if:
- [ ] Calendar shows classes from ClassInstance (not old WeeklySchedule)
- [ ] Calendar matches "Today's Classes" section
- [ ] Status colors work (Green/Red/Orange/Blue)
- [ ] Week navigation fetches correct data
- [ ] Console shows "Week classes: X" (not 0)
- [ ] No duplicate classes
- [ ] No classes on days without schedule

---

## 🚨 IF SOMETHING'S WRONG

### Issue: Calendar shows 0 classes
**Check:**
1. Do you have subjects with schedules? (Attendance page)
2. Check browser console: "Week classes: 0"
3. Check backend logs: "Found 0 classes for the week"
4. Add a subject with schedule for TODAY's day

### Issue: Calendar doesn't match "Today's Classes"
**Check:**
1. Browser console: Check if weekClasses.length matches todaysClasses.length
2. Network tab: Verify `/api/attendance/classes/week` returns data
3. Refresh page (Ctrl+R)

### Issue: Week navigation doesn't work
**Check:**
1. Console should show "🔄 Fetching dashboard data..." when clicking ← →
2. weekOffset parameter changing in network request
3. Try hard refresh (Ctrl+Shift+R)

---

## 📊 EXPECTED CONSOLE OUTPUT

```javascript
🔄 Fetching dashboard data...
📅 Today's date: 2024-12-XX
📅 Today's day: Monday
📊 Fetched data:
  - Habits: 0
  - Subjects: 3
  - Today's classes: 1
  - Week classes: 9
✅ Dashboard data loaded successfully
📅 Calendar will show: 9 classes for the week
```

---

## 🎯 QUICK FIX COMMANDS

### Clear and restart:
```bash
# Stop servers (Ctrl+C)
# Clear npm cache
npm cache clean --force

# Restart backend
cd backend
npm start

# Restart frontend (new terminal)
cd frontend
npm run dev
```

### Check database:
```javascript
// In MongoDB shell or Compass:
db.classinstances.find({ 
  user: ObjectId("your_user_id") 
}).count()

// Should return number > 0 if you have schedules
```

---

## ✅ DONE!

If all checks pass, your calendar is now synced with the schedule system!

**Next:** Use the app normally. Calendar will always show correct data from ClassInstance collection.
# 🔄 RESTART EVERYTHING - Apply All Changes

## ⚠️ CRITICAL: You MUST restart both servers for changes to take effect!

The calendar sync fix has been applied to the code, but you need to restart for it to work.

---

## 🚀 STEP-BY-STEP RESTART PROCEDURE

### Step 1: Stop All Running Servers

**In each terminal where servers are running:**
- Press `Ctrl + C` (Windows/Linux) or `Cmd + C` (Mac)
- Wait for process to stop completely

**Close ALL terminal windows** to be safe.

---

### Step 2: Clear Browser Cache

**Option A: Hard Refresh (Quick)**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Option B: Clear Cache (Thorough)**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option C: Incognito Mode (Safest)**
- Open new Incognito/Private window
- Navigate to `http://localhost:3000`

---

### Step 3: Restart Backend

**Terminal 1:**
```bash
cd C:\Users\ravir\Desktop\calender\backend
npm start
```

**Wait for:**
```
✅ Server running on port 5001
✅ MongoDB Connected
```

**If you see errors, check:**
- Is MongoDB running? (`mongod` command or service)
- Is port 5001 already in use? (Close other processes)

---

### Step 4: Restart Frontend

**Terminal 2:**
```bash
cd C:\Users\ravir\Desktop\calender\frontend
npm run dev
```

**Wait for:**
```
VITE ready in XXXms
Local: http://localhost:3000
```

**If you see errors:**
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

---

### Step 5: Verify Changes Applied

**Open browser:** `http://localhost:3000`

**Open DevTools Console (F12)**

**Look for these logs:**
```javascript
🔄 Fetching dashboard data...
📅 Today's date: YYYY-MM-DD
📅 Today's day: DayName
📊 Fetched data:
  - Habits: X
  - Subjects: X
  - Today's classes: X
  - Week classes: X  ← THIS IS NEW!
✅ Dashboard data loaded successfully
📅 Calendar will show: X classes for the week  ← THIS IS NEW!
```

**If you DON'T see "Week classes:" in logs:**
- Changes not applied yet
- Follow "Nuclear Restart" below

---

### Step 6: Test Calendar Sync

**Go to Dashboard:**
1. Look at weekly calendar (Mon-Sun boxes)
2. Check "Today's Classes" section below calendar
3. **VERIFY:** Both show the same classes

**Check Network Tab (F12 → Network):**
- Filter by "week"
- Should see: `GET /api/attendance/classes/week?weekOffset=0`
- Click it → Preview → Should show array of classes

**If API call is missing:**
- Frontend didn't update
- Follow "Nuclear Restart" below

---

## 🔥 NUCLEAR RESTART (If Nothing Worked)

### Backend:
```bash
cd C:\Users\ravir\Desktop\calender\backend

# Stop any node processes
taskkill /F /IM node.exe

# Clear cache
npm cache clean --force

# Verify the new function exists
type src\controllers\attendanceController.js | findstr "getWeekClasses"
# Should output: exports.getWeekClasses = async (req, res) => {

# Restart
npm start
```

### Frontend:
```bash
cd C:\Users\ravir\Desktop\calender\frontend

# Stop any node processes
taskkill /F /IM node.exe

# Clear cache and rebuild
npm cache clean --force
rd /s /q node_modules
rd /s /q dist
npm install
npm run dev
```

### Browser:
1. Close ALL browser tabs/windows
2. Reopen browser
3. Open Incognito mode
4. Go to `http://localhost:3000`

---

## 🧪 VERIFICATION CHECKLIST

After restart, verify:

- [ ] Backend log shows: "✅ Server running on port 5001"
- [ ] Frontend shows: "Local: http://localhost:3000"
- [ ] Browser console shows: "Week classes: X"
- [ ] Network tab shows: GET request to `/classes/week`
- [ ] Calendar displays classes
- [ ] Calendar matches "Today's Classes" section
- [ ] Week navigation (← →) works

---

## 🔍 DEBUGGING

### Issue: Console still shows old logs (no "Week classes")

**Problem:** Frontend serving cached build

**Fix:**
```bash
cd frontend
rd /s /q dist
npm run dev
```

Then hard refresh browser (Ctrl+Shift+R)

---

### Issue: Network tab shows no `/classes/week` request

**Problem:** Frontend code not updated

**Check file:**
```bash
cd frontend
type src\pages\Dashboard.jsx | findstr "getWeekClasses"
# Should output: attendanceService.getWeekClasses(currentWeek),
```

**If not found:**
- File wasn't saved correctly
- Re-apply the changes from CALENDAR_SYNC_FIX.md

---

### Issue: Backend returns 404 for `/classes/week`

**Problem:** Route not registered or backend not restarted

**Check route:**
```bash
cd backend
type src\routes\attendance.js | findstr "week"
# Should output: router.get("/classes/week", getWeekClasses);
```

**Fix:** Restart backend completely

---

## 📋 QUICK COMMAND SEQUENCE

**Copy-paste this entire block:**

```bash
# Stop everything
taskkill /F /IM node.exe

# Backend
cd C:\Users\ravir\Desktop\calender\backend
npm start

# Wait 5 seconds, then in NEW terminal:

# Frontend
cd C:\Users\ravir\Desktop\calender\frontend
npm run dev
```

Then:
1. Open browser incognito: `http://localhost:3000`
2. Press F12 (DevTools)
3. Check Console for "Week classes: X"
4. Check Network for `/classes/week` request

---

## ✅ SUCCESS INDICATORS

**You'll know it worked when:**

1. **Console shows:**
   ```
   Week classes: 9  ← NEW LOG LINE
   Calendar will show: 9 classes for the week  ← NEW LOG LINE
   ```

2. **Network tab shows:**
   ```
   GET /api/attendance/classes/week?weekOffset=0  ← NEW REQUEST
   Status: 200
   ```

3. **Calendar matches "Today's Classes":**
   - Same number of classes
   - Same subjects
   - Same times

---

## 🆘 STILL NOT WORKING?

**If after following ALL steps above, you still see no changes:**

1. **Verify files were actually modified:**
   ```bash
   cd backend\src\controllers
   findstr /N "getWeekClasses" attendanceController.js
   # Should show line 329
   ```

2. **Check Git status:**
   ```bash
   git status
   # Should show modified files
   ```

3. **Manual verification:**
   - Open `backend/src/controllers/attendanceController.js`
   - Search for "getWeekClasses"
   - If NOT FOUND → files weren't saved
   - Re-apply changes manually

4. **Last resort - Manual copy:**
   - I can provide the complete file content
   - You copy-paste and save
   - Then restart

---

## 📞 NEXT STEPS

**After successful restart:**

1. ✅ Test calendar displays correctly
2. ✅ Test week navigation (← →)
3. ✅ Test status updates (mark attended)
4. ✅ Verify sync with "Today's Classes"

**If STILL nothing changed after ALL of this:**

Reply with:
- Screenshot of browser console logs
- Screenshot of Network tab
- Output of: `type backend\src\controllers\attendanceController.js | findstr "getWeekClasses"`

---

**The code changes ARE in your files. You just need to restart properly to see them!**
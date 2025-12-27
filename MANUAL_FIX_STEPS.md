# 🔧 MANUAL FIX STEPS - Follow These Exactly

**Problem:** Classes not showing on Dashboard calendar  
**Cause:** Backend not restarted with new code + MongoDB might not be running  
**Time:** 10 minutes

---

## ⚠️ CRITICAL: Do These Steps IN ORDER

---

## STEP 1: Start MongoDB

### Option A: Via Services (Recommended)
1. Press `Windows + R`
2. Type: `services.msc`
3. Press Enter
4. Find "MongoDB" in the list
5. Right-click → Start
6. Wait for status to show "Running"

### Option B: Via Command
```cmd
net start MongoDB
```

### If MongoDB is Not Installed
Download from: https://www.mongodb.com/try/download/community  
Install and then return to Step 1.

**✅ Verify:** MongoDB service shows "Running" in Services

---

## STEP 2: Kill ALL Node Processes

### Option A: Via Task Manager (Recommended)
1. Press `Ctrl + Shift + Esc` (opens Task Manager)
2. Click "Details" tab
3. Find ALL `node.exe` entries
4. Select each one and click "End Task"
5. Make sure NO `node.exe` processes remain

### Option B: Via Command Prompt (as Administrator)
```cmd
taskkill /F /IM node.exe
```

**✅ Verify:** No `node.exe` in Task Manager Details tab

---

## STEP 3: Navigate to Backend Folder

```cmd
cd C:\Users\ravir\Desktop\calender\backend
```

**✅ Verify:** You see `package.json` when you type `dir`

---

## STEP 4: Check if New Code is in Place

```cmd
findstr /C:"generateClassInstances" src\controllers\scheduleController.js
```

**✅ Expected:** You should see lines with "generateClassInstances"  
**❌ If not found:** The file wasn't updated. Contact support.

---

## STEP 5: Run Migration Script

This converts old schedule data to the new system.

```cmd
node src\scripts\migrateSchedule.js
```

### Expected Output:
```
✅ Migration completed successfully!
   - Migrated X schedule entries
   - Updated Y subjects
   - Generated ClassInstances for next 4 weeks
```

### If You Get "Connection refused" Error:
- MongoDB is not running
- Go back to STEP 1
- Make sure MongoDB service is RUNNING

### If You Get "No WeeklySchedule entries to migrate":
- This is OK! It means you don't have old data
- Continue to next step

**✅ Verify:** Migration completed without errors

---

## STEP 6: Start Backend Server

Open a NEW Command Prompt window:

```cmd
cd C:\Users\ravir\Desktop\calender\backend
npm start
```

### Expected Output:
```
✅ MongoDB connected
✅ Server running on port 5000
```

OR

```
✅ MongoDB connected
✅ Server running on port 5001
```

### If You Get Errors:
- "ECONNREFUSED" → MongoDB not running (back to Step 1)
- "Port already in use" → Old node process still running (back to Step 2)
- "Cannot find module" → Run `npm install` first

**✅ Verify:** Backend shows "Server running" message  
**⚠️ LEAVE THIS WINDOW OPEN!**

---

## STEP 7: Start Frontend Server

Open ANOTHER NEW Command Prompt window:

```cmd
cd C:\Users\ravir\Desktop\calender\frontend
npm run dev
```

### Expected Output:
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

**✅ Verify:** Frontend shows "VITE ready" message  
**⚠️ LEAVE THIS WINDOW OPEN TOO!**

---

## STEP 8: Test in Browser

1. Open browser (Chrome recommended)
2. Go to: `http://localhost:5173`
3. Login with your credentials
4. Go to "Attendance" page
5. **If you don't have any subjects yet:**
   - Click "Add Subject"
   - Name: "Test Subject"
   - Color: Any color
   - Classes per week: 3
   - Click Save

6. Go to "Schedule" page
7. Add a schedule entry:
   - Day: Monday (or any day)
   - Time: 10:00
   - Subject: Select your subject
   - Click "Add"

8. Go to "Dashboard"
9. Navigate to the week that contains the day you selected

**✅ VERIFY:** The class appears in the calendar!

---

## STEP 9: If Classes Still Don't Appear

### Option A: Force Regenerate via API

1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage → http://localhost:5173
3. Find "token" and copy its value
4. Open a NEW Command Prompt:

```cmd
curl -X POST http://localhost:5000/api/schedule/regenerate -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the actual token.

### Option B: Add Schedule Entries Again

1. Go to Schedule page
2. Remove old entries (if any)
3. Add them again
4. The new code will auto-generate ClassInstances
5. Go to Dashboard and check

### Option C: Run Diagnostic

```cmd
cd C:\Users\ravir\Desktop\calender\backend
node src\scripts\diagnose.js
```

This will tell you exactly what's wrong and what to fix.

---

## STEP 10: Verify Everything Works

### Test 1: Classes Appear
- ✅ Schedule page shows your timetable
- ✅ Dashboard calendar shows the same classes
- ✅ "Today's Classes" section shows classes (if any today)

### Test 2: Mark Attendance
- ✅ Click "Attended" on a class
- ✅ Calendar cell changes color
- ✅ Attendance % updates

### Test 3: Week Navigation
- ✅ Click "Previous Week" / "Next Week"
- ✅ Classes for that week appear

---

## 🐛 TROUBLESHOOTING

### "Cannot GET /" error
- Frontend not running
- Check Step 7

### "Network Error" in browser
- Backend not running
- Check Step 6

### Empty calendar but schedule exists
**Solution 1:** Clear browser cache
1. Press Ctrl+Shift+Delete
2. Select "Cached images and files"
3. Click Clear
4. Refresh page (F5)

**Solution 2:** Hard refresh
- Press Ctrl+Shift+R (Chrome)
- Or Ctrl+F5

**Solution 3:** Use Incognito mode
- Press Ctrl+Shift+N
- Login again
- Check if classes appear

### MongoDB won't start
**Check if it's installed:**
```cmd
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --version
```

If you get "not found":
- MongoDB is not installed
- Download from: https://www.mongodb.com/try/download/community
- Install it
- Return to Step 1

### Backend shows port error
```cmd
netstat -ano | findstr :5000
```

This shows which process is using port 5000. Kill it:
```cmd
taskkill /F /PID <PID_NUMBER>
```

---

## ✅ SUCCESS CHECKLIST

After completing all steps:

- [ ] MongoDB service is running
- [ ] All old node processes killed
- [ ] Backend server running (window open)
- [ ] Frontend server running (window open)
- [ ] Can access http://localhost:5173
- [ ] Can login successfully
- [ ] Schedule page shows timetable
- [ ] Dashboard calendar shows classes
- [ ] Classes match between Schedule and Dashboard
- [ ] Can mark attendance
- [ ] Week navigation works

---

## 🎯 WHAT HAPPENS NOW

### When You Add a Schedule Entry:
1. Backend saves to `Subject.schedule` (the rule)
2. Backend **auto-generates** ClassInstances for next 4 weeks
3. Dashboard reads from ClassInstances
4. Classes appear immediately!

### Data Flow:
```
Schedule Page → Subject.schedule → ClassInstances → Dashboard
                (rules)            (auto-generated)  (displays)
```

---

## 📞 STILL NOT WORKING?

Run the diagnostic script:

```cmd
cd C:\Users\ravir\Desktop\calender\backend
node src\scripts\diagnose.js
```

It will show:
- What's wrong
- What needs to be fixed
- Exact commands to run

Then follow its recommendations.

---

## 🎓 KEY POINTS TO REMEMBER

1. **MongoDB MUST be running** - Check this first always
2. **Backend MUST be restarted** - Old code = old bugs
3. **Frontend MUST be restarted** - Cache issues otherwise
4. **Classes auto-generate** - You don't need to do anything special
5. **Adding schedule = Creating ClassInstances** - Happens automatically now

---

## 💡 PREVENTION

To avoid issues in future:

1. Always check MongoDB is running before starting servers
2. After code changes, restart both servers
3. Clear browser cache if changes don't appear
4. Run diagnostic script monthly for health checks

---

**If you followed all steps and it's still not working, the diagnostic script will tell you exactly what's wrong.**

**Status:** Ready to fix  
**Time needed:** 10 minutes  
**Difficulty:** Easy (just follow steps)

---

*Last updated: December 26, 2024*
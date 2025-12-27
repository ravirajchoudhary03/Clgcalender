================================================================================
                     YOUR PROBLEM IS SIMPLE
================================================================================

MongoDB database is NOT RUNNING on your computer.

That's the ONLY reason classes don't appear on Dashboard.

================================================================================
                     THE FIX (3 STEPS)
================================================================================

STEP 1: START MONGODB
----------------------

Option A - Windows Services (RECOMMENDED):
1. Press Windows Key + R on your keyboard
2. Type: services.msc
3. Press Enter
4. Look for "MongoDB" or "MongoDB Server" in the list
5. Right-click on it
6. Click "Start"
7. Wait until "Status" shows "Running"

Option B - Command Prompt (Run as Administrator):
1. Right-click on "Command Prompt"
2. Click "Run as administrator"
3. Type: net start MongoDB
4. Press Enter

If MongoDB is NOT installed on your computer:
- Go to: https://www.mongodb.com/try/download/community
- Download "MongoDB Community Server"
- Install it (click Next, Next, Next - use all defaults)
- After installation, use Option A above to start it


STEP 2: GENERATE DATA
----------------------

Open Command Prompt (regular, not admin needed):

cd C:\Users\ravir\Desktop\calender\backend
node test_and_fix.js

This will:
- Connect to MongoDB
- Create test subjects if needed
- Generate classes for the next 4 weeks
- Show you "SUCCESS!" when done


STEP 3: OPEN YOUR APP
----------------------

Make sure backend and frontend are running:

Backend (in one Command Prompt):
cd C:\Users\ravir\Desktop\calender\backend
npm start

Frontend (in another Command Prompt):
cd C:\Users\ravir\Desktop\calender\frontend
npm run dev

Then:
1. Open browser: http://localhost:5173
2. Press Ctrl+Shift+Delete (clear cache)
3. Login
4. Go to Dashboard
5. CLASSES WILL APPEAR!

================================================================================
                     WHY THIS HAPPENS
================================================================================

Your app needs MongoDB to store and retrieve data.

NO MongoDB running = NO data = EMPTY calendar

MongoDB running = Has data = CALENDAR SHOWS CLASSES!

================================================================================
                     CHECKLIST
================================================================================

[ ] MongoDB service is "Running" in services.msc
[ ] Ran "node test_and_fix.js" successfully
[ ] Backend shows "Server running on port 5001"
[ ] Frontend shows "VITE ready"
[ ] Opened http://localhost:5173
[ ] Cleared browser cache (Ctrl+Shift+Delete)
[ ] Logged in successfully
[ ] Dashboard shows classes in calendar

================================================================================
                     STILL NOT WORKING?
================================================================================

Check these in order:

1. Is MongoDB actually running?
   - Open services.msc
   - Find MongoDB
   - Status should be "Running"

2. Did test_and_fix.js succeed?
   - It should say "SUCCESS! Your data is ready!"
   - If it says "connection refused" → MongoDB not running (back to Step 1)

3. Are backend and frontend both running?
   - You should see 2 command prompt windows open
   - One says "Server running on port 5001"
   - One says "VITE ready"

4. Did you clear browser cache?
   - Press Ctrl+Shift+Delete
   - Check "Cached images and files"
   - Click "Clear data"

5. Are you logged in?
   - The app needs you to be logged in to show your data

================================================================================
                     IMPORTANT NOTES
================================================================================

- MongoDB MUST be running ALWAYS when using the app
- If you restart your computer, you need to start MongoDB again
- Backend and frontend must both be running
- Browser cache can cause old data to show - clear it

================================================================================

START WITH STEP 1 NOW: START MONGODB!

Everything depends on MongoDB being running.

================================================================================

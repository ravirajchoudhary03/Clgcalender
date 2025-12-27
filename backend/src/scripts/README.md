# 🛠️ Backend Maintenance Scripts

This directory contains diagnostic and migration scripts for maintaining the attendance tracker system.

---

## 📋 Available Scripts

### 1. `diagnose.js` - System Diagnostic

**Purpose:** Checks the current state of your database and identifies issues.

**Usage:**
```bash
cd backend
node src/scripts/diagnose.js
```

**What it checks:**
- ✅ WeeklySchedule entries (legacy system)
- ✅ Subject schedules (schedule rules)
- ✅ ClassInstance records (actual classes)
- ✅ Status distribution (pending/attended/missed/cancelled)
- ✅ Data consistency (subjects with schedules have ClassInstances)

**When to run:**
- Before and after migration
- When debugging calendar sync issues
- After adding new subjects
- As part of regular maintenance

**Sample Output:**
```
🔍 ATTENDANCE TRACKER DIAGNOSTIC REPORT
============================================================
📅 Run Date: 2024-12-15 10:30:00
============================================================

CHECK 1: WeeklySchedule Collection (LEGACY SYSTEM)
✅ No WeeklySchedule entries (good - using new system)

CHECK 2: Subjects (Schedule Rules)
📚 Total subjects: 5
📅 Subjects with schedules: 5

CHECK 3: ClassInstances (Actual Classes)
📋 Total ClassInstances: 120
📅 Today's ClassInstances: 3
📅 This week's ClassInstances: 15
🔮 Future ClassInstances: 100

✅ Diagnostic complete!
```

---

### 2. `migrateSchedule.js` - Data Migration

**Purpose:** One-time migration from WeeklySchedule (legacy) to Subject.schedule + ClassInstance (new architecture).

**Usage:**
```bash
cd backend
node src/scripts/migrateSchedule.js
```

**What it does:**
1. Reads all WeeklySchedule entries
2. Groups by subject
3. Adds time slots to Subject.schedule
4. Generates ClassInstance records for next 4 weeks
5. Reports migration summary

**⚠️ IMPORTANT:**
- This is a **one-time migration**
- Always backup your database first
- Can be run multiple times safely (idempotent)

**Before running:**
```bash
# Backup database
mongodump --db attendance-tracker --out backup-$(date +%Y%m%d)

# Run diagnostic to see current state
node src/scripts/diagnose.js
```

**After running:**
```bash
# Verify migration
node src/scripts/diagnose.js

# Optional: Clean up old WeeklySchedule collection
mongosh attendance-tracker
db.weeklyschedules.deleteMany({})
```

**Sample Output:**
```
🔄 Starting schedule migration...
📊 Connecting to database...
✅ Connected to database
📅 Found 25 WeeklySchedule entries
📚 Found 5 unique subjects

📖 Processing subject: Mathematics
   Time slots to add: 3
   ✅ Added: Mon 09:00-10:00
   ✅ Added: Wed 09:00-10:00
   ✅ Added: Fri 09:00-10:00
   💾 Saved subject with 3 time slots
   🔄 Generating ClassInstances for next 4 weeks...
      ✅ Created 12 ClassInstances

✅ Migration completed successfully!

📋 Summary:
   - Migrated 25 schedule entries
   - Updated 5 subjects
   - Generated ClassInstances for next 4 weeks
```

---

## 🚀 Common Workflows

### First-Time Setup (Fresh Install)
```bash
# 1. Check system state
node src/scripts/diagnose.js

# 2. If you have old WeeklySchedule data, migrate it
node src/scripts/migrateSchedule.js

# 3. Verify migration
node src/scripts/diagnose.js
```

### Troubleshooting "No Classes on Dashboard"
```bash
# 1. Run diagnostic
node src/scripts/diagnose.js

# 2. Look for recommendations in output
# 3. If subjects exist but no ClassInstances, regenerate via API:
curl -X POST http://localhost:5000/api/schedule/regenerate \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Verify again
node src/scripts/diagnose.js
```

### Weekly Maintenance
```bash
# Check system health
node src/scripts/diagnose.js

# Look for:
# - Low future ClassInstances count
# - Data consistency issues
# - Status distribution anomalies
```

---

## 🔧 Environment Requirements

### Dependencies
Both scripts require:
- `mongoose` - MongoDB connection
- `dayjs` - Date manipulation
- `dotenv` - Environment variables

### Environment Variables
Create a `.env` file in the `backend` directory:
```env
MONGO_URI=mongodb://localhost:27017/attendance-tracker
```

Or use default: `mongodb://localhost:27017/attendance-tracker`

---

## 📊 Understanding the Data Models

### Subject.schedule (Schedule Rules)
```javascript
{
  name: "Mathematics",
  schedule: [
    { day: "Mon", startTime: "09:00", endTime: "10:00" },
    { day: "Wed", startTime: "09:00", endTime: "10:00" },
    { day: "Fri", startTime: "09:00", endTime: "10:00" }
  ],
  classesPerWeek: 3
}
```

### ClassInstance (Actual Classes)
```javascript
{
  subject: ObjectId("..."),
  date: ISODate("2024-12-16T00:00:00Z"),
  startTime: "09:00",
  endTime: "10:00",
  day: "Mon",
  status: "pending" // or "attended", "missed", "cancelled"
}
```

---

## ❓ FAQ

**Q: Can I run the migration script multiple times?**  
A: Yes, it's idempotent. It checks for existing data before creating duplicates.

**Q: What happens to old WeeklySchedule data after migration?**  
A: It remains in the database until you manually delete it. The new system doesn't use it.

**Q: How often should I run diagnostics?**  
A: Run it whenever you experience issues, after migrations, or as part of weekly maintenance.

**Q: What if diagnostics show "Low number of future ClassInstances"?**  
A: Call the regenerate API endpoint: `POST /api/schedule/regenerate`

**Q: Can I rollback a migration?**  
A: Yes, if you created a backup with `mongodump`, restore it with `mongorestore`.

**Q: Do these scripts require the server to be running?**  
A: No, they connect directly to MongoDB and don't need the API server.

---

## 🐛 Troubleshooting

### "Connection refused" error
```bash
# Make sure MongoDB is running
sudo systemctl status mongod  # Linux
brew services list            # macOS
```

### "Cannot find module" error
```bash
# Install dependencies
cd backend
npm install
```

### "MONGO_URI not defined" warning
```bash
# Create .env file or use default connection string
echo "MONGO_URI=mongodb://localhost:27017/attendance-tracker" > .env
```

---

## 📞 Support

If you encounter issues:
1. Check error messages carefully
2. Run diagnostic script to identify problems
3. Review the main SCHEDULE_SYNC_FIX.md documentation
4. Check backend logs for more details

---

**Last Updated:** 2024  
**Maintained by:** Backend Team
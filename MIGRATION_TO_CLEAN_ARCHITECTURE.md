# 🔄 MIGRATION PLAN: Fix Existing Project to Clean Architecture

## 🎯 GOAL
Transform the current broken attendance system into a production-grade architecture with:
- ONE schedule system (no duplicates)
- Timezone-safe date handling
- Derived attendance stats (no manual counters)
- Dashboard-only attendance marking

---

## ⚠️ CURRENT PROBLEMS

### 1. **Dual Schedule Systems**
- `Subject.schedule[]` (embedded in Subject model)
- `WeeklySchedule` model (separate collection)
- They don't sync → causes confusion

### 2. **Manual Counter Updates**
- `Subject.totalClasses`, `classesAttended`, `classesCancelled`
- Updated manually in controllers
- Prone to bugs (double-counting, missed updates)

### 3. **No Timezone Support**
- `User` model has no timezone field
- All dates use server timezone
- "Today" means different things for users in different timezones

### 4. **Broken Class Generation**
- `generateClassInstances()` in `attendanceController.js`
- Uses server time instead of user time
- Only runs once at subject creation

### 5. **No Single Source of Truth**
- Attendance can be marked from multiple places
- Stats calculated inconsistently

---

## 🛠️ MIGRATION STEPS

### **PHASE 1: Database Cleanup (NO CODE CHANGES YET)**

#### Step 1.1: Backup Current Database
```bash
# Connect to MongoDB
mongodump --db college-organizer --out ./backup-$(date +%Y%m%d)
```

#### Step 1.2: Understand Current Data
```javascript
// In MongoDB shell or Compass, run:
db.subjects.find().count()
db.classinstances.find().count()
db.weeklyschedules.find().count()
db.users.find().count()

// Check if users have timezone field
db.users.findOne()
```

---

### **PHASE 2: Add New Models (KEEP OLD ONES)**

#### Step 2.1: Create ScheduleRule Model
**File:** `backend/src/models/ScheduleRule.js`

```javascript
const mongoose = require('mongoose');

const scheduleRuleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  daysOfWeek: {
    type: [String],
    required: true,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

scheduleRuleSchema.index({ user: 1, subject: 1 });

module.exports = mongoose.model('ScheduleRule', scheduleRuleSchema);
```

#### Step 2.2: Update User Model to Add Timezone
**File:** `backend/src/models/User.js`

```javascript
// Add this field to existing User schema:
timezone: {
  type: String,
  default: 'UTC'
}
```

#### Step 2.3: Update ClassInstance Model
**File:** `backend/src/models/ClassInstance.js`

Add reference to ScheduleRule:
```javascript
scheduleRule: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'ScheduleRule',
  required: false // Make optional for migration
}
```

---

### **PHASE 3: Create Clean Utilities**

#### Step 3.1: Install dayjs with timezone plugin
```bash
cd backend
npm install dayjs
```

#### Step 3.2: Create classGenerator Utility
**File:** `backend/src/utils/classGenerator.js`

Copy the complete file from `attendance-tracker-v2/backend/src/utils/classGenerator.js`

Key functions:
- `generateClassInstances()` - timezone-safe generation
- `ensureUpcomingInstances()` - idempotent class creation
- `regenerateClassInstances()` - update schedule
- `toUTCMidnight()` - consistent date conversion

---

### **PHASE 4: Create New Controllers (PARALLEL TO OLD)**

#### Step 4.1: Create scheduleController.js
**File:** `backend/src/controllers/scheduleController.js`

Copy from `attendance-tracker-v2` - handles ScheduleRule CRUD + auto-generation

#### Step 4.2: Create NEW classController.js
**File:** `backend/src/controllers/classControllerV2.js` (temporary name)

Handles:
- `getClassesInRange()` - for calendar
- `updateClassStatus()` - mark attendance
- `getTodaysClasses()` - dashboard view

#### Step 4.3: Create NEW attendanceController.js
**File:** `backend/src/controllers/attendanceControllerV2.js`

READ-ONLY endpoints:
- `getAttendanceSummary()` - all subjects
- `getSubjectAttendance()` - one subject

Uses ClassInstance aggregation (no manual counters)

---

### **PHASE 5: Add New Routes (PARALLEL TO OLD)**

#### Step 5.1: Create New Route Files
**File:** `backend/src/routes/scheduleV2.js`
**File:** `backend/src/routes/classesV2.js`
**File:** `backend/src/routes/attendanceV2.js`

#### Step 5.2: Register Routes in server.js
```javascript
// OLD routes (keep for now)
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/schedule', require('./routes/schedule'));

// NEW routes (v2)
app.use('/api/v2/schedule', require('./routes/scheduleV2'));
app.use('/api/v2/classes', require('./routes/classesV2'));
app.use('/api/v2/attendance', require('./routes/attendanceV2'));
```

---

### **PHASE 6: Data Migration Script**

#### Step 6.1: Create Migration Script
**File:** `backend/src/scripts/migrateToCleanArchitecture.js`

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const ScheduleRule = require('../models/ScheduleRule');
const ClassInstance = require('../models/ClassInstance');
const { generateClassInstances } = require('../utils/classGenerator');
const connectDB = require('../config/database');

async function migrate() {
  console.log('🚀 Starting migration...');

  // 1. Add timezone to all users (default UTC)
  console.log('📍 Setting default timezone for users...');
  await User.updateMany(
    { timezone: { $exists: false } },
    { $set: { timezone: 'UTC' } }
  );

  // 2. For each Subject with schedule[], create ScheduleRule
  console.log('📋 Migrating Subject schedules to ScheduleRule...');
  const subjects = await Subject.find({ schedule: { $exists: true, $ne: [] } });

  for (const subject of subjects) {
    // Check if ScheduleRule already exists
    const existingRule = await ScheduleRule.findOne({
      user: subject.user,
      subject: subject._id
    });

    if (!existingRule && subject.schedule && subject.schedule.length > 0) {
      // Extract unique days
      const daysOfWeek = [...new Set(subject.schedule.map(s => s.day))];

      // Use first schedule slot's time (assuming all same time per day)
      const firstSlot = subject.schedule[0];

      const scheduleRule = await ScheduleRule.create({
        user: subject.user,
        subject: subject._id,
        daysOfWeek: daysOfWeek,
        startTime: firstSlot.startTime,
        endTime: firstSlot.endTime
      });

      console.log(`✅ Created ScheduleRule for ${subject.name}`);

      // 3. Update existing ClassInstances to reference new ScheduleRule
      await ClassInstance.updateMany(
        { subject: subject._id, scheduleRule: { $exists: false } },
        { $set: { scheduleRule: scheduleRule._id } }
      );

      // 4. Generate missing class instances
      const user = await User.findById(subject.user);
      const instancesData = await generateClassInstances(
        scheduleRule,
        user.timezone,
        4
      );

      if (instancesData.length > 0) {
        await ClassInstance.insertMany(instancesData, { ordered: false })
          .catch(err => {
            if (err.code !== 11000) throw err;
          });
        console.log(`✅ Generated ${instancesData.length} class instances`);
      }
    }
  }

  // 5. Recalculate attendance from ClassInstances
  console.log('📊 Recalculating attendance stats...');
  const allSubjects = await Subject.find();

  for (const subject of allSubjects) {
    const stats = await ClassInstance.aggregate([
      {
        $match: {
          subject: subject._id,
          date: { $lte: new Date() }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    let attended = 0, total = 0, cancelled = 0;

    stats.forEach(s => {
      if (s._id === 'attended') attended = s.count;
      if (s._id === 'cancelled') cancelled = s.count;
      total += s.count;
    });

    subject.classesAttended = attended;
    subject.totalClasses = total;
    subject.classesCancelled = cancelled;
    await subject.save();

    console.log(`✅ Updated stats for ${subject.name}: ${attended}/${total-cancelled}`);
  }

  console.log('✅ Migration complete!');
}

// Run migration
connectDB().then(async () => {
  await migrate();
  process.exit(0);
}).catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
```

#### Step 6.2: Run Migration
```bash
cd backend
node src/scripts/migrateToCleanArchitecture.js
```

---

### **PHASE 7: Update Frontend to Use V2 APIs**

#### Step 7.1: Update API Service
**File:** `frontend/src/services/api.js`

Add new API calls:
```javascript
// V2 Schedule APIs
export const scheduleAPI = {
  create: (data) => api.post('/v2/schedule', data),
  getAll: () => api.get('/v2/schedule'),
  getBySubject: (subjectId) => api.get(`/v2/schedule/${subjectId}`),
  delete: (ruleId) => api.delete(`/v2/schedule/${ruleId}`),
  getWeeklySummary: () => api.get('/v2/schedule/summary')
};

// V2 Classes APIs
export const classesAPI = {
  getRange: (start, end) => api.get('/v2/classes/range', { params: { start, end } }),
  updateStatus: (classId, status) => api.post(`/v2/classes/${classId}/status`, { status }),
  getToday: () => api.get('/v2/classes/today')
};

// V2 Attendance APIs
export const attendanceAPI = {
  getSummary: () => api.get('/v2/attendance/summary'),
  getSubject: (subjectId) => api.get(`/v2/attendance/subject/${subjectId}`)
};
```

#### Step 7.2: Update Dashboard Component
**File:** `frontend/src/pages/Dashboard.jsx`

Change from:
```javascript
attendanceService.getTodaysClasses()
```

To:
```javascript
classesAPI.getToday()
```

Use calendar integration instead of manual date rendering.

#### Step 7.3: Update Schedule Component
Make it the ONLY place to create schedules:
- Add subject
- Define weekly pattern (days + times)
- Auto-generates ClassInstances

#### Step 7.4: Update Attendance Component
Make it READ-ONLY:
- No edit buttons
- No manual attendance logging
- Only shows stats derived from ClassInstances

---

### **PHASE 8: Testing**

#### Test 8.1: Verify Data Migration
```javascript
// In MongoDB shell:

// Check ScheduleRules created
db.schedulerules.find().count()

// Check ClassInstances have scheduleRule reference
db.classinstances.find({ scheduleRule: { $exists: true } }).count()

// Check attendance stats match
db.subjects.aggregate([
  {
    $lookup: {
      from: 'classinstances',
      let: { subjectId: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$subject', '$$subjectId'] } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ],
      as: 'classStats'
    }
  }
])
```

#### Test 8.2: Test New Workflows
1. **Create Schedule:**
   - POST /api/v2/schedule
   - Verify ClassInstances generated
   - Check in database

2. **View Calendar:**
   - GET /api/v2/classes/range?start=2024-01-01&end=2024-01-31
   - Verify correct timezone conversion

3. **Mark Attendance:**
   - POST /api/v2/classes/{id}/status
   - Verify status updated
   - Check attendance stats recalculate

4. **View Attendance:**
   - GET /api/v2/attendance/summary
   - Verify stats match ClassInstances

---

### **PHASE 9: Cleanup Old System**

#### Step 9.1: Remove Old Routes
```javascript
// Delete these from server.js:
app.use('/api/attendance', require('./routes/attendance')); // OLD
app.use('/api/schedule', require('./routes/schedule')); // OLD
```

#### Step 9.2: Remove V2 Prefix
Rename routes:
- `/api/v2/schedule` → `/api/schedule`
- `/api/v2/classes` → `/api/classes`
- `/api/v2/attendance` → `/api/attendance`

#### Step 9.3: Remove Old Files
```bash
# Backup first!
mkdir backend/src/OLD_SYSTEM
mv backend/src/controllers/attendanceController.js backend/src/OLD_SYSTEM/
mv backend/src/routes/attendance.js backend/src/OLD_SYSTEM/
```

#### Step 9.4: Clean Up Subject Model
Remove deprecated fields:
```javascript
// Remove these from Subject schema:
// - totalClasses (now derived)
// - classesAttended (now derived)
// - classesCancelled (now derived)
// - schedule[] (moved to ScheduleRule)
```

**Note:** Keep these fields during transition for backwards compatibility, remove after full migration.

#### Step 9.5: Drop Old Collections
```javascript
// In MongoDB shell (AFTER VERIFYING NEW SYSTEM WORKS):
db.weeklyschedules.drop() // If exists
db.attendancelogs.drop()   // Legacy collection
```

---

## 🎯 FINAL ARCHITECTURE

### After migration, you have:

```
┌─────────────────────────────────────────────┐
│           USER (with timezone)              │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│   SUBJECT    │      │  SCHEDULE RULE   │
│  (metadata)  │◄─────│ (weekly pattern) │
└──────────────┘      └──────────────────┘
                              │
                              │ generates
                              ▼
                      ┌──────────────────┐
                      │ CLASS INSTANCE   │
                      │  (actual class)  │
                      │  status: pending │
                      │         attended │
                      │         missed   │
                      │         cancelled│
                      └──────────────────┘
                              │
                              │ aggregates into
                              ▼
                      ┌──────────────────┐
                      │ ATTENDANCE STATS │
                      │  (derived only)  │
                      └──────────────────┘
```

### Data Flow:
```
Schedule Page → ScheduleRule created
    ↓
Auto-generates ClassInstances (4 weeks)
    ↓
Dashboard shows ClassInstances in calendar
    ↓
User marks attendance
    ↓
Updates ClassInstance.status
    ↓
Attendance page derives stats via aggregation
```

---

## ✅ VERIFICATION CHECKLIST

After migration, verify:

- [ ] All users have timezone field
- [ ] All subjects have corresponding ScheduleRule
- [ ] All ClassInstances reference a ScheduleRule
- [ ] Attendance stats match ClassInstance records
- [ ] No duplicate schedule systems exist
- [ ] Calendar shows correct classes
- [ ] Marking attendance updates ClassInstance only
- [ ] Attendance page is read-only
- [ ] Timezone conversion works correctly
- [ ] Old routes removed
- [ ] Old controller files backed up and removed

---

## 🚨 ROLLBACK PLAN

If migration fails:

1. **Restore Database:**
```bash
mongorestore --db college-organizer ./backup-YYYYMMDD/college-organizer
```

2. **Revert Code:**
```bash
git checkout main  # or your stable branch
```

3. **Remove New Collections:**
```javascript
db.schedulerules.drop()
```

4. **Restart Servers:**
```bash
cd backend && npm start
cd frontend && npm run dev
```

---

## 📊 MIGRATION TIMELINE

| Phase | Duration | Blocker? |
|-------|----------|----------|
| Phase 1: Backup | 5 min | No |
| Phase 2: New Models | 30 min | No |
| Phase 3: Utilities | 15 min | No |
| Phase 4: Controllers | 1 hour | No |
| Phase 5: Routes | 30 min | No |
| Phase 6: Migration Script | 1 hour | **YES** |
| Phase 7: Frontend Update | 2 hours | **YES** |
| Phase 8: Testing | 1 hour | **YES** |
| Phase 9: Cleanup | 30 min | No |
| **TOTAL** | **~7 hours** | |

---

## 🎓 POST-MIGRATION BENEFITS

### Before (Current System):
- ❌ Two schedule systems (confusing)
- ❌ Manual counter updates (buggy)
- ❌ No timezone support
- ❌ Attendance editable everywhere
- ❌ Stats inconsistent

### After (Clean Architecture):
- ✅ ONE schedule system (ScheduleRule)
- ✅ Derived stats (no manual updates)
- ✅ Timezone-safe (UTC + user timezone)
- ✅ Attendance marked ONLY on Dashboard
- ✅ Stats always accurate (from ClassInstances)

---

## 📚 ADDITIONAL RESOURCES

- Read: `attendance-tracker-v2/README.md` for complete new architecture
- Reference: `attendance-tracker-v2/backend/src/` for clean implementation
- Docs: MongoDB aggregation pipeline for stats calculation
- Docs: dayjs timezone handling

---

**This migration transforms your broken system into a production-grade architecture. Follow each phase carefully. Test thoroughly. Don't skip backups.**
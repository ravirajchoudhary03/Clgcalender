// Dashboard: Beautiful calendar view with assignments, exams, study timer & attendance
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import habitService from "../services/habitService";
import attendanceService from "../services/attendanceService";
import scheduleService from "../services/scheduleService";
import assignmentService from "../services/assignmentService";
import examService from "../services/examService";
import { TodaysClasses } from "../components/TodaysClasses";

import { useAuth } from "../context/AuthContext";

export const Dashboard = () => {
  const { user } = useAuth(); // Get user from context
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [weekClasses, setWeekClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [timer, setTimer] = useState(45 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);

  // Refetch when week changes
  useEffect(() => {
    fetchData();
  }, [currentWeek]);
  const [classesLoading, setClassesLoading] = useState(false);

  useEffect(() => {
    fetchData();

    // Refresh data when component becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also refresh every 30 seconds to catch new classes
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const fetchData = async () => {
    console.log("🔄 Fetching dashboard data...");
    console.log("📅 Today's date:", dayjs().format("YYYY-MM-DD"));
    console.log("📅 Today's day:", dayjs().format("dddd"));

    try {
      // Calculate correct start (Mon) and end (Sun) of week
      const currentDayObj = dayjs().add(currentWeek * 7, "day");
      const currentDayIdx = currentDayObj.day(); // 0-6
      const diffToMonday = currentDayIdx === 0 ? -6 : 1 - currentDayIdx;

      const startOfWeekObj = currentDayObj.add(diffToMonday, "day");
      const endOfWeekObj = startOfWeekObj.add(6, "day");

      const startOfWeek = startOfWeekObj.format("YYYY-MM-DD");
      const endOfWeek = endOfWeekObj.format("YYYY-MM-DD");

      const [habitsRes, attendanceRes, todaysRes, weekRes, assignRes, examRes, habitLogsRes] = await Promise.all([
        habitService.list(),
        attendanceService.listSubjects(),
        attendanceService.getTodaysClasses(),
        attendanceService.getWeekClasses(currentWeek),
        assignmentService.list(),
        examService.list(),
        habitService.getLogs(startOfWeek, endOfWeek),
      ]);

      console.log("📊 Fetched data:");
      console.log("  - Habits:", habitsRes.data?.length || 0);
      console.log("  - Subjects:", attendanceRes.data?.length || 0);
      console.log("  - Today's classes:", todaysRes.data?.length || 0);
      console.log("  - Week classes:", weekRes.data?.length || 0);

      // Log subjects with schedules
      const subjectsWithSchedule = (attendanceRes.data || []).filter(
        (s) => s.schedule && s.schedule.length > 0,
      );
      console.log("📚 Subjects with schedules:", subjectsWithSchedule.length);
      subjectsWithSchedule.forEach((s) => {
        console.log(`  - ${s.name}: ${s.schedule.length} time slots`);
        s.schedule?.forEach((slot) => {
          console.log(`    → ${slot.day}: ${slot.startTime} - ${slot.endTime}`);
        });
      });

      // Log today's classes details
      if (todaysRes.data && todaysRes.data.length > 0) {
        console.log("✅ Today's classes found:");
        todaysRes.data.forEach((cls) => {
          console.log(
            `  - ${cls.subject?.name || "Unknown"}: ${cls.startTime} - ${cls.endTime} (${cls.status})`,
          );
        });
      } else {
        console.log("⚠️ No classes found for today");
      }

      setHabits(habitsRes.data || []);
      setAttendance(attendanceRes.data || []);
      setTodaysClasses(todaysRes.data || []);
      setWeekClasses(weekRes.data || []);
      setAssignments(assignRes.data || []);
      setExams(examRes.data || []);

      // Calculate Performance Data
      const activeHabitsCount = (habitsRes.data || []).length;
      const logs = habitLogsRes.data || [];
      const classes = weekRes.data || [];
      const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      const graphData = shortDays.map((dayName, idx) => {
        // Correct date for this day of week (Mon is start)
        const dateStr = dayjs(startOfWeek).add(idx, 'day').format('YYYY-MM-DD');

        // Habit Score
        const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
        const score = activeHabitsCount > 0 ? Math.round((dayLogs.length / activeHabitsCount) * 100) : 0;

        // Classes Attended
        const dayClasses = classes.filter(c => dayjs(c.date).format('YYYY-MM-DD') === dateStr);
        const attended = dayClasses.filter(c => c.status === 'attended').length;

        return { day: dayName, score, attended };
      });

      setPerformanceData(graphData);

      console.log("✅ Dashboard data loaded successfully");
      console.log(
        "📅 Calendar will show:",
        weekRes.data?.length || 0,
        "classes for the week",
      );
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClassStatus = async (classId, status) => {
    setClassesLoading(true);
    try {
      const res = await attendanceService.updateClassStatus(classId, status);

      // Update todaysClasses with new status
      setTodaysClasses((prev) =>
        prev.map((cls) =>
          cls._id === classId
            ? { ...cls, status, subject: res.data.subject }
            : cls,
        ),
      );

      // Update attendance data to reflect new percentages
      if (res.data.subject) {
        setAttendance((prev) =>
          prev.map((sub) =>
            sub._id === res.data.subject._id ? res.data.subject : sub,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating class status:", error);
    } finally {
      setClassesLoading(false);
    }
  };

  const getWeekDates = () => {
    // Calculate Monday of the current week (ISO week: Mon-Sun)
    const today = dayjs().add(currentWeek * 7, "day");
    const currentDay = today.day(); // 0 (Sun) to 6 (Sat)

    // If Sunday (0), we want previous Monday (-6 days). If Mon (1), 0 days back. 
    // Logic: diff = (day === 0 ? -6 : 1 - day)
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = today.add(diffToMonday, "day");

    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(monday.add(i, "day"));
    }
    return dates;
  };

  const startTimer = (minutes) => {
    setTimer(minutes * 60);
    setTimerActive(true);
  };

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds || 0);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-400">Loading dashboard...</div>
    );

  const weekDates = getWeekDates();
  const attendancePercentage =
    attendance.length > 0
      ? Math.round(
        attendance.reduce((sum, a) => {
          if (!a.totalClasses) return sum;
          return sum + (a.classesAttended / a.totalClasses) * 100;
        }, 0) / attendance.filter((a) => a.totalClasses).length || 0,
      )
      : 0;

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const scheduleDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-slate-900/70 border border-slate-700 rounded-2xl px-6 py-4 shadow-lg shadow-black/40 backdrop-blur-xl">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 tracking-wide">
              College Smart Calendar
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Smart overview of your week, assignments & attendance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="h-9 w-9 rounded-full bg-slate-800/70 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors text-sm">
              🔔
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Welcome back</p>
                <p className="text-sm font-semibold text-slate-100">{user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border border-slate-600 shadow-md" />
            </div>
          </div>
        </div>

        {/* Week Calendar */}
        <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setCurrentWeek((w) => w - 1)}
              className="text-gray-300 hover:text-white text-2xl"
            >
              ←
            </button>
            <h2 className="text-xl font-bold text-white">
              {weekDates[0].format("MMM D")} – {weekDates[6].format("MMM D")}
            </h2>
            <button
              onClick={() => setCurrentWeek((w) => w + 1)}
              className="text-gray-300 hover:text-white text-2xl"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {weekDates.map((date, i) => {
              // Filter classes from weekClasses for this specific date
              const classesForDay = weekClasses.filter((cls) => {
                const classDate = dayjs(cls.date);
                return classDate.isSame(date, "day");
              });

              const isToday = date.isSame(dayjs(), "day");

              return (
                <div
                  key={i}
                  className="bg-gray-700 bg-opacity-50 rounded-lg p-4 border border-gray-600 min-h-40"
                >
                  <div className="text-sm font-semibold text-gray-300 mb-3">
                    {shortDays[i]} {date.date()}
                  </div>
                  <div className="space-y-2">
                    {/* Show classes from ClassInstance data */}
                    {classesForDay.map((cls) => (
                      <div
                        key={cls._id}
                        className={`text-white text-xs rounded px-2 py-1 truncate ${cls.status === "attended"
                          ? "bg-green-600 bg-opacity-80"
                          : cls.status === "missed"
                            ? "bg-red-600 bg-opacity-80"
                            : cls.status === "cancelled"
                              ? "bg-orange-600 bg-opacity-80"
                              : "bg-blue-600 bg-opacity-80"
                          }`}
                        title={`${cls.subject?.name} - ${cls.status}`}
                      >
                        {cls.startTime} - {cls.subject?.name || "Class"}
                      </div>
                    ))}

                    {/* If today but no classes, show today badge */}
                    {isToday && classesForDay.length === 0 && (
                      <div className="bg-green-600 text-white text-xs rounded px-2 py-1 font-bold text-center">
                        📅 Today
                      </div>
                    )}

                    {/* If today and has classes, show today indicator */}
                    {isToday && classesForDay.length > 0 && (
                      <div className="bg-green-600 text-white text-xs rounded px-2 py-1 font-bold text-center">
                        📅 Today ({classesForDay.length})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reminders */}
          <div className="mt-6 bg-blue-900 bg-opacity-30 border border-blue-600 rounded p-4">
            <p className="text-blue-300 font-semibold text-sm">
              💡 <strong>Tip:</strong> Calendar now synced with "Today's
              Classes" section below. Classes are color-coded: 🟢 Attended | 🔵
              Pending | 🔴 Missed | 🟠 Cancelled
            </p>
          </div>
        </div>

        {/* Today's Classes Section */}
        <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>📚</span>
              Today's Classes ({dayjs().format("dddd, MMM D")})
            </h2>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 flex items-center gap-2"
              title="Refresh classes"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Loading...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  Refresh
                </>
              )}
            </button>
          </div>

          {/* Debug Info */}
          <div className="mb-4 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-3 text-xs text-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <strong>Debug Info:</strong> {todaysClasses.length} classes
                found for today
              </div>
              <div>
                Subjects with schedules:{" "}
                {
                  attendance.filter((s) => s.schedule && s.schedule.length > 0)
                    .length
                }
              </div>
            </div>
          </div>

          <TodaysClasses
            classes={todaysClasses}
            onUpdateStatus={handleUpdateClassStatus}
            loading={classesLoading}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Assignments Due */}
          <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Assignments Due</h3>
              <span className="text-2xl cursor-pointer hover:text-gray-300">
                →
              </span>
            </div>
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No assignments due! 🎉</p>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className={`bg-gray-700 bg-opacity-50 rounded p-3 border-l-4 ${dayjs(assignment.due_date).diff(dayjs(), 'hour') < 24 ? 'border-red-500' : 'border-blue-500'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {assignment.completed ? '✓ ' : '○ '} {assignment.title}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {assignment.subject?.name} • Due: {dayjs(assignment.due_date).format("MMM D, h:mm A")}
                        </p>
                      </div>
                      {!assignment.completed && dayjs(assignment.due_date).diff(dayjs(), 'day') <= 2 && (
                        <span className="bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                          !
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Upcoming Exams</h3>
              <span className="text-2xl cursor-pointer hover:text-gray-300">
                →
              </span>
            </div>
            {exams.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No upcoming exams! 🎈</p>
            ) : (
              exams.map((exam) => (
                <div key={exam.id} className="bg-gray-700 bg-opacity-50 rounded p-4 border border-blue-600 mb-3">
                  <p className="text-white font-bold text-sm">{exam.title}</p>
                  <p className="text-gray-300 text-xs mt-2 flex items-center gap-1">
                    📅 {dayjs(exam.date).format("MMM D, YYYY")} • {exam.subject?.name}
                  </p>
                  {exam.syllabus && (
                    <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded font-semibold transition" onClick={() => alert(exam.syllabus)}>
                      View Syllabus →
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Study Planner */}
          <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-bold text-white mb-4">
              Today's Study Planner
            </h3>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3">
                {formatTime(timer)}
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => startTimer(45)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold text-sm transition"
                >
                  ● Read Focus Mode
                </button>
                <button
                  onClick={() => startTimer(30)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold text-sm transition"
                >
                  ▶️ Solve 2 Practice Sets
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Tracker */}
          <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                Attendance Tracker
              </h3>
              <span className="text-2xl">⚙️</span>
            </div>
            <div
              className={`text-center p-3 rounded-lg mb-3 ${attendancePercentage >= 75 ? "bg-green-900 bg-opacity-30" : "bg-red-900 bg-opacity-30"}`}
            >
              <p
                className={`text-3xl font-bold ${attendancePercentage >= 75 ? "text-green-400" : "text-red-400"}`}
              >
                {attendancePercentage}%
              </p>
              <p className="text-gray-300 text-xs mt-1">
                {attendancePercentage < 75
                  ? "⚠️ Miss 1 More Class = Shortage!"
                  : "✅ Good Standing"}
              </p>
            </div>
            <div className="space-y-2 text-sm">
              {attendance.slice(0, 3).map((a, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-gray-300"
                >
                  <span>{a.name.slice(0, 12)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {a.totalClasses > 0
                        ? Math.round((a.classesAttended / a.totalClasses) * 100)
                        : 0}
                      %
                    </span>
                    <span className="text-green-400">✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Graph & Quick Links */}
        <div className="grid grid-cols-3 gap-6">
          {/* Performance Graph */}
          <div className="col-span-2 bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Performance Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={performanceData}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #555",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", r: 5 }}
                  name="Score"
                />
                <Line
                  type="monotone"
                  dataKey="attended"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 5 }}
                  name="Classes"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Links & Status */}
          <div className="space-y-6">
            {/* Next Steps */}
            <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Next Step</h3>
                <span className="text-2xl cursor-pointer hover:text-gray-300">
                  →
                </span>
              </div>
              <p className="text-white font-semibold text-sm mt-3">
                Start Revision! 📚
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⬆️</span>
                  <p className="text-gray-300 text-sm">Level Up!</p>
                </div>
                <div className="w-full bg-red-600 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-400 h-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-2xl">😰</span>
                  <p className="text-gray-300 text-sm">Stress Meter</p>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

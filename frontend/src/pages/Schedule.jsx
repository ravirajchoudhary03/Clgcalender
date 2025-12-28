// Schedule page: manage weekly timetable, mark today's classes attended/missed
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import scheduleService from "../services/scheduleService";
import attendanceService from "../services/attendanceService";
import { SubjectForm } from "../components/SubjectForm";

export const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [day, setDay] = useState("Mon");
  const [time, setTime] = useState("09:00");
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scheduleRes, todaysClassesRes, subjectsRes] = await Promise.all([
        scheduleService.list(),
        scheduleService.getTodaysClasses(),
        attendanceService.listSubjects(),
      ]);
      setSchedule(scheduleRes.data || []);
      setTodaysClasses(todaysClassesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setTodaysClasses([]); // Prevent crash
      setSubjects([]); // Prevent crash
      setError("Failed to load schedule");
    }
  };

  const addSchedule = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      setError("Select subject");
      return;
    }
    setLoading(true);
    try {
      await scheduleService.add(day, time, subjectId);
      fetchData();
      setDay("Mon");
      setTime("09:00");
      setSubjectId("");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add schedule");
    } finally {
      setLoading(false);
    }
  };

  const markClass = async (scheduleId, status) => {
    try {
      await scheduleService.markClass(scheduleId, status);
      fetchData();
    } catch (err) {
      console.error(err);
      setError("Failed to mark attendance");
    }
  };

  // getSubjectAttendance removed as it is not needed with fetchData

  const handleAddSubject = async (subjectData) => {
    setLoading(true);
    setError("");
    try {
      await attendanceService.createSubject(
        subjectData.name,
        subjectData.color,
        subjectData.classesPerWeek,
        subjectData.schedule,
      );
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add subject");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    setLoading(true);
    try {
      await attendanceService.deleteSubject(id);
      fetchData();
    } catch (err) {
      setError("Failed to delete subject");
    } finally {
      setLoading(false);
    }
  };

  const scheduleByDay = (dayName) => schedule.filter((s) => s.day === dayName);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {/* Add Subject */}
      <div className="bg-green-50 border border-green-200 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Add a Subject</h2>
        <SubjectForm onSubmit={handleAddSubject} loading={loading} />
      </div>

      {/* List Existing Subjects */}
      <div className="bg-white border border-gray-200 shadow rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Your Subjects</h2>
        {subjects.length === 0 ? (
          <p className="text-gray-500">No subjects added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => (
              <div
                key={subj.id}
                className="flex justify-between items-center p-3 rounded-lg border border-gray-200 bg-gray-50"
                style={{ borderLeft: `4px solid ${subj.color || '#34D399'}` }}
              >
                <div>
                  <p className="font-semibold text-gray-900">{subj.name}</p>
                  <p className="text-xs text-gray-500">
                    {subj.percent !== undefined ? `Attendance: ${subj.percent}%` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSubject(subj.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                  title="Delete Subject"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Temporarily hidden - endpoint not implemented */}
      {true && (
        <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Add to Timetable</h2>
          <form onSubmit={addSchedule} className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-sm font-semibold mb-1">Day</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="border border-gray-300 p-2 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border border-gray-300 p-2 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-sm font-semibold mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </form>
        </div>
      )}

      {/* Today's Classes */}
      <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">
          Today's Classes ({dayjs().format("dddd")})
        </h2>
        {todaysClasses.length > 0 ? (
          <div className="space-y-3">
            {todaysClasses.map((cls) => (
              <div
                key={cls._id || cls.id}
                className="bg-blue-50 border border-blue-300 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-lg">{cls.subject.name}</p>
                  <p className="text-sm text-gray-600">{cls.startTime} - {cls.endTime}</p>
                  {cls.subject.percent !== undefined && (
                    <p className="text-sm text-gray-600">
                      Attendance: {cls.subject.percent}%
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      markClass(cls._id || cls.id, "attended");
                    }}
                    className={`px-4 py-2 rounded text-sm font-semibold text-white ${cls.status === 'attended' ? 'bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    Attended
                  </button>
                  <button
                    onClick={() => {
                      markClass(cls._id || cls.id, "missed");
                    }}
                    className={`px-4 py-2 rounded text-sm font-semibold text-white ${cls.status === 'missed' ? 'bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    Missed
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No classes scheduled for today</p>
        )}
      </div>

      {/* Weekly Timetable */}
      <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Weekly Timetable</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {days.map((dayName) => (
            <div
              key={dayName}
              className="border border-blue-200 bg-slate-50 rounded-lg p-3"
            >
              <h3 className="font-bold text-lg mb-2">{dayName}</h3>
              <div className="space-y-2">
                {scheduleByDay(dayName).map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-blue-100 border border-blue-200 p-2 rounded text-sm"
                  >
                    <p className="font-semibold">{entry.subjectName}</p>
                    <p className="text-gray-600 text-xs">{entry.start_time} - {entry.end_time}</p>
                  </div>
                ))}
                {scheduleByDay(dayName).length === 0 && (
                  <p className="text-gray-400 text-xs italic">No classes</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

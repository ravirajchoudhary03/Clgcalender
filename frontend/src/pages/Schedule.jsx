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
      const [classesRes, subjRes] = await Promise.all([
        // scheduleService.list(), // Commented out - endpoint not implemented
        scheduleService.getTodaysClasses(),
        attendanceService.listSubjects(),
      ]);
      // setSchedule(schedRes.data);
      setTodaysClasses(classesRes.data);
      setSubjects(subjRes.data);
    } catch (err) {
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
      const date = dayjs().format("YYYY-MM-DD");
      await scheduleService.markClass(scheduleId, date, status);
      fetchData();
    } catch (err) {
      setError("Failed to mark attendance");
    }
  };

  const getSubjectAttendance = async (subjectId) => {
    try {
      const res = await scheduleService.getSubjectAttendance(subjectId);
      // Update the subject in the state with the new attendance data
      setTodaysClasses(
        todaysClasses.map((c) =>
          c.subject._id === subjectId
            ? { ...c, subject: { ...c.subject, ...res.data } }
            : c,
        ),
      );
    } catch (err) {
      console.error("Failed to get subject attendance");
    }
  };

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

      {/* Temporarily hidden - endpoint not implemented */}
      {false && (
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
                key={cls.id}
                className="bg-blue-50 border border-blue-300 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-lg">{cls.subject.name}</p>
                  <p className="text-sm text-gray-600">{cls.time}</p>
                  {cls.subject.percent !== undefined && (
                    <p className="text-sm text-gray-600">
                      Attendance: {cls.subject.percent}%
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      markClass(cls.id, "attended");
                      getSubjectAttendance(cls.subject.id);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold"
                  >
                    Attended
                  </button>
                  <button
                    onClick={() => {
                      markClass(cls.id, "missed");
                      getSubjectAttendance(cls.subject.id);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold"
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
                    <p className="font-semibold">{entry.subject.name}</p>
                    <p className="text-gray-600 text-xs">{entry.time}</p>
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

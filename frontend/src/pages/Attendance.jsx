// Attendance page: manage subjects, view attendance percentage and status
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import attendanceService from "../services/attendanceService";
import { SubjectForm } from "../components/SubjectForm";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Attendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedStatus, setSelectedStatus] = useState("attended");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await attendanceService.listSubjects();
      setSubjects(res.data);
    } catch (err) {
      setError("Failed to load subjects");
    }
  };

  const handleAddSubject = async (subjectData) => {
    setLoading(true);
    setError("");
    try {
      const res = await attendanceService.createSubject(
        subjectData.name,
        subjectData.color,
        subjectData.classesPerWeek,
        subjectData.schedule,
      );
      setSubjects([...subjects, res.data]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add subject");
    } finally {
      setLoading(false);
    }
  };

  const logAttendance = async (subjectId, status) => {
    try {
      await attendanceService.logAttendance(subjectId, date, status);
      fetchSubjects();
    } catch (err) {
      setError("Failed to log attendance");
    }
  };

  const getStatusColor = (percent) => {
    if (percent >= 75) return "bg-green-100 border-green-300";
    if (percent >= 65) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  const getStatusBadge = (percent) => {
    if (percent >= 75)
      return (
        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
          Good
        </span>
      );
    if (percent >= 65)
      return (
        <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
          At Risk
        </span>
      );
    return (
      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
        Critical
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {/* Add Subject Form */}
      <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Add a Subject</h2>
        <SubjectForm onSubmit={handleAddSubject} loading={loading} />
      </div>

      {/* Manual Log Form */}
      <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-6">
        <h3 className="font-bold mb-3">Log Attendance Manually</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-sm font-semibold mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 p-2 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 p-2 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="attended">Attended</option>
              <option value="missed">Missed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Subject</label>
            <select
              className="border border-gray-300 p-2 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              onChange={(e) => {
                if (e.target.value)
                  logAttendance(e.target.value, selectedStatus);
              }}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((subject) => {
          const barData = [
            {
              name: "Attended",
              value: subject.classesAttended,
              fill: "#34D399",
            },
            {
              name: "Missed",
              value: subject.totalClasses - subject.classesAttended,
              fill: "#F87171",
            },
          ];
          return (
            <div
              key={subject._id}
              className={`border-2 rounded-lg p-4 ${getStatusColor(subject.percent)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{subject.name}</h3>
                  <p className="text-sm text-gray-600">
                    {subject.classesAttended}/{subject.totalClasses} attended
                  </p>
                </div>
                {getStatusBadge(subject.percent)}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-300 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${subject.percent}%`,
                    backgroundColor:
                      subject.percent >= 75
                        ? "#10B981"
                        : subject.percent >= 65
                          ? "#FBBF24"
                          : "#EF4444",
                  }}
                ></div>
              </div>

              <p className="text-center font-bold text-lg mb-3">
                {subject.percent}%
              </p>

              {/* Pie Chart */}
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={barData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>

      {subjects.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          Add a subject to track attendance
        </p>
      )}
    </div>
  );
};

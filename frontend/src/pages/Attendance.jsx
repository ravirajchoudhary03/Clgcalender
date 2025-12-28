// Attendance page: view attendance percentage and status (read-only)
import { useState, useEffect } from "react";
import attendanceService from "../services/attendanceService";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

export const Attendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await attendanceService.listSubjects();
      setSubjects(res.data || []); // Default to empty array
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setSubjects([]); // Prevent crash
      setError("Failed to load subjects");
    }
  };

  // Removed handleAddSubject and logAttendance - Attendance is now read-only

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

      {/* Attendance is now read-only - subjects are managed from Schedule page */}

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

// TodaysClasses.jsx - Display today's scheduled classes with attendance controls

import { useState } from "react";
import dayjs from "dayjs";

export const TodaysClasses = ({ classes, onUpdateStatus, loading }) => {
  const [updatingClass, setUpdatingClass] = useState(null);

  const handleStatusUpdate = async (classId, status) => {
    setUpdatingClass(classId);
    try {
      await onUpdateStatus(classId, status);
    } finally {
      setUpdatingClass(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: "bg-gray-100",
        text: "text-gray-600",
        label: "Pending",
        icon: "⏳",
      },
      attended: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Attended",
        icon: "✅",
      },
      missed: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Missed",
        icon: "❌",
      },
      cancelled: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "Cancelled",
        icon: "🚫",
      },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span
        className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1`}
      >
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-8">
        <div className="text-center">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-xl font-bold text-gray-800 mb-2">
            No classes scheduled for today
          </p>
          <p className="text-gray-600 mb-6">
            Today is{" "}
            {new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </p>

          <div className="bg-white rounded-lg p-6 border border-blue-300 max-w-md mx-auto">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              💡 Why am I not seeing classes?
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>You haven't added any subjects with schedules yet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>
                  Your subjects don't have classes scheduled for today
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Click the Refresh button above to reload</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Tip:</strong> Go to Attendance page → Add a subject →
                Click "Add Schedule" → Add a time slot for today's day → Come
                back here to see it!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {classes.map((classItem) => {
        const isUpdating = updatingClass === classItem._id;
        const subject = classItem.subject;

        return (
          <div
            key={classItem._id}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: subject?.color || "#34D399" }}
                  />
                  <h3 className="text-lg font-bold text-gray-900">
                    {subject?.name || "Unknown Subject"}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    🕐{" "}
                    <strong>
                      {classItem.startTime} - {classItem.endTime}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1">
                    📅 {dayjs(classItem.date).format("ddd, MMM D")}
                  </span>
                </div>
              </div>

              <div>{getStatusBadge(classItem.status)}</div>
            </div>

            {/* Attendance Control Buttons */}
            {classItem.status === "pending" && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleStatusUpdate(classItem._id, "attended")}
                  disabled={isUpdating}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span>✅</span>
                  )}
                  Attended
                </button>

                <button
                  onClick={() => handleStatusUpdate(classItem._id, "missed")}
                  disabled={isUpdating}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span>❌</span>
                  )}
                  Missed
                </button>

                <button
                  onClick={() => handleStatusUpdate(classItem._id, "cancelled")}
                  disabled={isUpdating}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span>🚫</span>
                  )}
                  Cancelled
                </button>
              </div>
            )}

            {/* Show change option for already marked classes */}
            {classItem.status !== "pending" && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <details className="group">
                  <summary className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium list-none flex items-center justify-center gap-1">
                    Change Status
                    <span className="group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="flex gap-2 mt-3">
                    {classItem.status !== "attended" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(classItem._id, "attended")
                        }
                        disabled={isUpdating}
                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg font-medium text-xs transition-all disabled:opacity-50"
                      >
                        ✅ Attended
                      </button>
                    )}
                    {classItem.status !== "missed" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(classItem._id, "missed")
                        }
                        disabled={isUpdating}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg font-medium text-xs transition-all disabled:opacity-50"
                      >
                        ❌ Missed
                      </button>
                    )}
                    {classItem.status !== "cancelled" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(classItem._id, "cancelled")
                        }
                        disabled={isUpdating}
                        className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 px-3 rounded-lg font-medium text-xs transition-all disabled:opacity-50"
                      >
                        🚫 Cancelled
                      </button>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Subject Attendance Summary */}
            {subject && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Subject Attendance:</span>
                  <span className="font-semibold">
                    {subject.classesAttended || 0} / {subject.totalClasses || 0}{" "}
                    classes
                    {subject.percent !== undefined && (
                      <span
                        className={`ml-2 ${
                          subject.percent >= 75
                            ? "text-green-600"
                            : subject.percent >= 65
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        ({subject.percent}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

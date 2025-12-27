// SubjectForm.jsx - Enhanced form for creating subjects with weekly schedule including start and end times

import { useState } from "react";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COLORS = [
  "#34D399",
  "#60A5FA",
  "#F87171",
  "#FBBF24",
  "#A78BFA",
  "#F472B6",
  "#FB923C",
  "#10B981",
];

export const SubjectForm = ({ onSubmit, loading }) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#34D399");
  const [schedule, setSchedule] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);

  const handleAddTimeSlot = () => {
    setSchedule([
      ...schedule,
      { day: "Mon", startTime: "09:00", endTime: "10:00" },
    ]);
  };

  const handleRemoveTimeSlot = (index) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleUpdateTimeSlot = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Validate time slots
    const validSchedule = schedule.filter(
      (slot) => slot.startTime && slot.endTime && slot.day,
    );

    if (showSchedule && validSchedule.length === 0) {
      alert(
        "Please add at least one valid time slot or hide the schedule section.",
      );
      return;
    }

    onSubmit({
      name: name.trim(),
      color,
      classesPerWeek: validSchedule.length,
      schedule: validSchedule,
    });

    // Reset form
    setName("");
    setColor("#34D399");
    setSchedule([]);
    setShowSchedule(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subject Name */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-800">
          Subject Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Data Structures, Web Development"
          className="w-full border border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          required
        />
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-800">
          Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-12 h-12 rounded-lg transition-all border-2 ${
                color === c
                  ? "ring-4 ring-blue-400 scale-110 border-white"
                  : "border-gray-300 hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Schedule Section */}
      <div className="border-t border-gray-300 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-800">
            Weekly Schedule (Optional)
          </label>
          <button
            type="button"
            onClick={() => setShowSchedule(!showSchedule)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
              showSchedule
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
            }`}
          >
            {showSchedule ? "Hide Schedule" : "📅 Add Schedule"}
          </button>
        </div>

        {showSchedule && (
          <div className="space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            {schedule.length === 0 && (
              <div className="text-center py-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 font-medium mb-2">
                  📚 No classes scheduled yet
                </p>
                <p className="text-sm text-gray-400">
                  Click "Add Time Slot" below to create your class schedule
                </p>
              </div>
            )}

            {schedule.map((slot, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition"
              >
                <div className="flex gap-3 items-end">
                  {/* Day Selector */}
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      📅 Day
                    </label>
                    <select
                      value={slot.day}
                      onChange={(e) =>
                        handleUpdateTimeSlot(index, "day", e.target.value)
                      }
                      className="w-full border border-gray-300 p-2.5 rounded-lg bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Time */}
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      🕐 Start Time
                    </label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        handleUpdateTimeSlot(index, "startTime", e.target.value)
                      }
                      className="w-full border border-gray-300 p-2.5 rounded-lg bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      required
                    />
                  </div>

                  {/* End Time */}
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      🕐 End Time
                    </label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        handleUpdateTimeSlot(index, "endTime", e.target.value)
                      }
                      className="w-full border border-gray-300 p-2.5 rounded-lg bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveTimeSlot(index)}
                    className="px-3 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-bold text-sm"
                    title="Remove time slot"
                  >
                    ✕
                  </button>
                </div>

                {/* Time slot preview */}
                <div className="mt-2 text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded border border-blue-200">
                  <strong>{slot.day}:</strong> {slot.startTime} - {slot.endTime}
                </div>
              </div>
            ))}

            {/* Add Time Slot Button */}
            <button
              type="button"
              onClick={handleAddTimeSlot}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-lg">➕</span>
              Add Time Slot
            </button>

            {/* Schedule Summary */}
            {schedule.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border-2 border-green-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-green-800">
                      📊 Schedule Summary
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      {schedule.length}{" "}
                      {schedule.length === 1 ? "class" : "classes"} per week
                    </p>
                  </div>
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                    {schedule.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            Adding Subject...
          </>
        ) : (
          <>
            <span>✅</span>
            Add Subject
          </>
        )}
      </button>

      {/* Help Text */}
      {!showSchedule && (
        <p className="text-xs text-gray-500 text-center mt-2">
          💡 Tip: Add a weekly schedule to automatically track attendance for
          this subject
        </p>
      )}
    </form>
  );
};

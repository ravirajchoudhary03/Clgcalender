// Habits page: add habits, view daily checkboxes, completion stats
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import habitService from "../services/habitService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#60A5FA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);

  const colors = ["#60A5FA", "#34D399", "#F87171", "#FBBF24", "#A78BFA"];

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await habitService.list();
      setHabits(res.data || []); // Default to empty array if data is undefined
      if (res.data && res.data.length > 0) {
        setSelectedHabit(res.data[0].id);
        fetchStats(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load habits:', err);
      setHabits([]); // Set empty array on error to prevent crash
      setError("Failed to load habits");
    }
  };

  const fetchStats = async (habitId) => {
    try {
      const end = dayjs().format("YYYY-MM-DD");
      const start = dayjs().subtract(30, "day").format("YYYY-MM-DD");
      const res = await habitService.getStats(habitId, start, end);
      setStats(res.data);
    } catch (err) {
      setError("Failed to load stats");
    }
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (habits.length >= 10) {
      setError("Max 10 habits allowed");
      return;
    }
    if (!title.trim()) {
      setError("Title required");
      return;
    }
    setLoading(true);
    try {
      const res = await habitService.create(title, color);
      setHabits([...habits, res.data]);
      setTitle("");
      setColor("#60A5FA");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add habit");
    } finally {
      setLoading(false);
    }
  };

  const selectHabit = (habitId) => {
    setSelectedHabit(habitId);
    fetchStats(habitId);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {/* Add Habit Form */}
      <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Add a Habit</h2>
        <form onSubmit={addHabit} className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-40">
            <label className="block text-sm font-semibold mb-1">
              Habit Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Study 2 hrs"
              className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Color</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="border border-gray-300 p-2 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
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
        <p className="text-xs text-gray-500 mt-2">{habits.length}/10 habits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habits List */}
        <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-4">
          <h3 className="text-lg font-bold mb-3">Your Habits</h3>
          <div className="space-y-2">
            {habits.map((habit) => (
              <button
                key={habit.id}
                onClick={() => selectHabit(habit.id)}
                className={`w-full text-left px-3 py-2 rounded ${selectedHabit === habit.id
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 hover:bg-blue-150"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  ></div>
                  <span>{habit.title}</span>
                </div>
              </button>
            ))}
            {habits.length === 0 && (
              <p className="text-gray-500 text-sm">No habits yet</p>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="lg:col-span-2">
            <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-bold">Last 30 Days</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.completed}
                  </p>
                  <p className="text-sm text-gray-600">Days Completed</p>
                </div>
                <div className="bg-green-50 p-4 rounded text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {stats.totalDays}
                  </p>
                  <p className="text-sm text-gray-600">Total Days</p>
                </div>
                <div className="bg-purple-50 p-4 rounded text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.percent}%
                  </p>
                  <p className="text-sm text-gray-600">Completion</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Navigation menu
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => {
    return location.pathname === path
      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
      : "text-slate-400 hover:text-white hover:bg-slate-800/50";
  };

  const navItemClass = "flex items-center gap-2 px-4 py-2 transition-all duration-200 text-sm font-medium rounded-full";

  return (
    <nav className="bg-slate-950/80 border-b border-slate-800 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">

        {/* Logo / Brand */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300 border border-white/10">
            <span className="filter drop-shadow-md">📆</span>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-200 tracking-tight leading-none group-hover:to-white transition-colors">
              ClgCalendar
            </span>
            <span className="text-[10px] text-indigo-300/80 font-bold tracking-widest uppercase mt-0.5 group-hover:text-indigo-300 transition-colors">
              Smart Planner
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 h-full pt-1">
          <Link to="/dashboard" className={`${navItemClass} ${isActive('/dashboard')}`}>
            <span>📊</span>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link to="/schedule" className={`${navItemClass} ${isActive('/schedule')}`}>
            <span>🕒</span>
            <span className="hidden sm:inline">Schedule</span>
          </Link>
          <Link to="/attendance" className={`${navItemClass} ${isActive('/attendance')}`}>
            <span>📅</span>
            <span className="hidden sm:inline">Attendance</span>
          </Link>
          <Link to="/habits" className={`${navItemClass} ${isActive('/habits')}`}>
            <span>✅</span>
            <span className="hidden sm:inline">Habits</span>
          </Link>
        </div>

        {/* User Profile & Logout */}
        <div className="flex gap-4 items-center">
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-500 font-medium">Signed in as</p>
            <p className="text-xs text-slate-200 font-bold truncate max-w-[100px]">{user.user_metadata?.name || user.email?.split('@')[0]}</p>
          </div>
          <button
            onClick={logout}
            className="group relative px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 transition-all duration-300 flex items-center gap-2 text-xs font-semibold"
            title="Logout"
          >
            <span>🚪</span>
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

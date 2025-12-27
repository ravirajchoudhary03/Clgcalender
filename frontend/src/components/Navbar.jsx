// Navigation menu
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-slate-900/70 border-b border-slate-800 backdrop-blur-xl text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex gap-6 text-sm">
          <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">Dashboard</Link>
          <Link to="/habits" className="text-slate-400 hover:text-white transition-colors">Habits</Link>
          <Link to="/attendance" className="text-slate-400 hover:text-white transition-colors">Attendance</Link>
          <Link to="/schedule" className="text-slate-400 hover:text-white transition-colors">Schedule</Link>
        </div>
        <div className="flex gap-4 items-center text-xs">
          <span className="text-slate-300">{user.name}</span>
          <button
            onClick={logout}
            className="px-3 py-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-white shadow-sm shadow-red-500/40 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

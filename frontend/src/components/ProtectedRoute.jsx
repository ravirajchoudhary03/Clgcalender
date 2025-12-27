// ProtectedRoute: wrapper to ensure user is authenticated
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Requires user to be logged in
export const PrivateRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-primary-400">Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Requires user to be a farmer
export const FarmerRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-primary-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'farmer') return <Navigate to="/" replace />;
  return <Outlet />;
};

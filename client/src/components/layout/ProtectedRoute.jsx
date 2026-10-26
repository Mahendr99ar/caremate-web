import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useGetMeQuery } from '../../services/api';
import { PageLoader } from '../ui';

// The cookie is httpOnly, so JS can't read it. The only way to know if
// we're logged in is to ask the server (/auth/me).
export function ProtectedRoute() {
  const location = useLocation();
  const { data: user, isLoading } = useGetMeQuery();

  if (isLoading) return <PageLoader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

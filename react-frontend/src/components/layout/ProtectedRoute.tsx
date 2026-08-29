import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: Props) {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.some(r => authService.hasRole(r))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}

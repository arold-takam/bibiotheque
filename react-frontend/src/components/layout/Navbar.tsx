import { Link, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Tooltip } from '../ui/Tooltip';

export function Navbar() {
  const user = authService.getUser();
  const isLoggedIn = authService.isLoggedIn();
  const isAdmin = authService.hasRole('Admin');
  const isUser = authService.hasRole('User');
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-300 hover:text-white';

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-white flex items-center gap-2">
            📚 Bibliothèque
          </Link>

          {isLoggedIn && (
            <div className="flex items-center gap-1">
              {isAdmin && (
                <>
                  <Link to="/books" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/books')}`}>
                    Livres
                  </Link>
                  <Link to="/users" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/users')}`}>
                    Utilisateurs
                  </Link>
                </>
              )}
              {isUser && (
                <>
                  <Link to="/borrow" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/borrow')}`}>
                    Emprunts
                  </Link>
                  <Link to="/return" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/return')}`}>
                    Retours
                  </Link>
                  <Link to="/reservations" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/reservations')}`}>
                    Réservations
                  </Link>
                </>
              )}
            </div>
          )}

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Tooltip content={user?.role?.map(r => r.roleName).join(', ') || ''}>
                <span className="text-sm text-gray-300">
                  👋 <strong className="text-white">{user?.name}</strong>
                </span>
              </Tooltip>
              <button
                onClick={() => authService.logout()}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/login" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

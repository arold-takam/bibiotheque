import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

export function Home() {
  const isLoggedIn = authService.isLoggedIn();
  const isAdmin = authService.hasRole('Admin');
  const isUser = authService.hasRole('User');

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-6">
        <span className="text-6xl">📚</span>
        <h1 className="text-4xl font-bold text-white">Bibliothèque</h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Système de gestion de bibliothèque — emprunts, retours et réservations
        </p>
        {!isLoggedIn ? (
          <Link to="/login" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Se connecter
          </Link>
        ) : (
          <div className="flex gap-4 justify-center">
            {isAdmin && (
              <>
                <Link to="/books" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  📖 Livres
                </Link>
                <Link to="/users" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  👥 Utilisateurs
                </Link>
              </>
            )}
            {isUser && (
              <>
                <Link to="/borrow" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  📤 Emprunts
                </Link>
                <Link to="/reservations" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  📋 Réservations
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

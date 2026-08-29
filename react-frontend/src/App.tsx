import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Books } from './pages/Books';
import { Users } from './pages/Users';
import { Borrow } from './pages/Borrow';
import { Return } from './pages/Return';
import { Reservations } from './pages/Reservations';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1f2937' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
        }}
      />
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/forbidden" element={<div className="text-center py-20"><h1 className="text-4xl">🚫</h1><p className="text-gray-400 mt-4">Accès interdit</p></div>} />

          {/* Admin routes */}
          <Route path="/books" element={<ProtectedRoute roles={['Admin']}><Books /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['Admin']}><Users /></ProtectedRoute>} />

          {/* User routes */}
          <Route path="/borrow" element={<ProtectedRoute roles={['User']}><Borrow /></ProtectedRoute>} />
          <Route path="/return" element={<ProtectedRoute roles={['User']}><Return /></ProtectedRoute>} />
          <Route path="/reservations" element={<ProtectedRoute roles={['User']}><Reservations /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

import { useState, useEffect } from 'react';
import { usersService } from '../services/usersService';
import type { User } from '../models/types';
import { TableSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersService.getAll().then(setUsers).catch(() => toast.error('Erreur')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">👥 Utilisateurs</h1>
      {loading ? <TableSkeleton rows={5} cols={4} /> : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-900/50">
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Username</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Rôle</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-700/50">
              {users.map(u => (
                <tr key={u.userId} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-sm">{u.userId}</td>
                  <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-300">{u.username}</td>
                  <td className="px-4 py-3">
                    {u.role?.map(r => (
                      <span key={r.roleId} className={`inline-block px-2 py-0.5 text-xs rounded-full mr-1 ${r.roleName === 'Admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                        {r.roleName}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import type { Borrow } from '../models/types';
import { TableSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export function Return() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}').userId;
      const { data } = await apiClient.get<Borrow[]>(`/borrow/user/${userId}`);
      setBorrows(data);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // PUT /borrow { borrowId, bookId, userId } — route backend réelle
  const handleReturn = async (b: Borrow) => {
    try {
      await apiClient.put('/borrow', { borrowId: b.borrowId, bookId: b.bookId, userId: b.userId });
      toast.success('Livre retourné');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur retour');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">📥 Retourner un livre</h1>
      {loading ? <TableSkeleton rows={5} cols={5} /> : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-900/50">
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Livre ID</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Emprunté le</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Échéance</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Rendu le</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-700/50">
              {borrows.map(b => (
                <tr key={b.borrowId} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-sm">{b.borrowId}</td>
                  <td className="px-4 py-3 text-white">{b.bookId}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{b.issueDate}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{b.dueDate}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{b.returnDate || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {!b.returnDate && (
                      <button onClick={() => handleReturn(b)} className="px-3 py-1 text-xs bg-green-600/20 text-green-400 border border-green-500/30 rounded-md hover:bg-green-600/40 transition-colors">
                        Retourner
                      </button>
                    )}
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

import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import type { Book } from '../models/types';
import { TableSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export function Borrow() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Book[]>('/admin/books');
      setBooks(data.filter(b => b.disponible));
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleBorrow = async (bookId: number) => {
    try {
      await apiClient.post('/borrow', { bookId, userId: JSON.parse(localStorage.getItem('user') || '{}').userId });
      toast.success('Emprunt réussi');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur emprunt');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">📤 Emprunter un livre</h1>
      {loading ? <TableSkeleton rows={5} cols={5} /> : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-900/50">
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Auteur</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Copies</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-700/50">
              {books.map(b => (
                <tr key={b.bookId} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-sm">{b.bookId}</td>
                  <td className="px-4 py-3 text-white font-medium">{b.bookName}</td>
                  <td className="px-4 py-3 text-gray-300">{b.bookAuthor}</td>
                  <td className="px-4 py-3 text-green-400">{b.noOfCopies}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleBorrow(b.bookId)} className="px-3 py-1 text-xs bg-green-600/20 text-green-400 border border-green-500/30 rounded-md hover:bg-green-600/40 transition-colors">
                      Emprunter
                    </button>
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

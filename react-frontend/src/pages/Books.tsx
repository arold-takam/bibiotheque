import { useState, useEffect } from 'react';
import { booksService } from '../services/booksService';
import type { Book } from '../models/types';
import { TableSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bookName: '', bookAuthor: '', bookGenre: '', noOfCopies: 1 });

  const load = async () => {
    setLoading(true);
    try { setBooks(await booksService.getAll()); }
    catch { toast.error('Erreur chargement livres'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await booksService.create({ ...form, disponible: true });
      toast.success('Livre créé');
      setShowForm(false);
      setForm({ bookName: '', bookAuthor: '', bookGenre: '', noOfCopies: 1 });
      load();
    } catch { toast.error('Erreur création'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce livre ?')) return;
    try { await booksService.delete(id); toast.success('Supprimé'); load(); }
    catch { toast.error('Erreur suppression'); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">📖 Livres</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
          {showForm ? '✕ Annuler' : '➕ Ajouter'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nom" value={form.bookName} onChange={e => setForm({...form, bookName: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
            <input placeholder="Auteur" value={form.bookAuthor} onChange={e => setForm({...form, bookAuthor: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
            <input placeholder="Genre" value={form.bookGenre} onChange={e => setForm({...form, bookGenre: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
            <input type="number" placeholder="Exemplaires" value={form.noOfCopies} onChange={e => setForm({...form, noOfCopies: +e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
          </div>
          <button onClick={handleCreate} disabled={!form.bookName} className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors">Créer</button>
        </div>
      )}

      {loading ? <TableSkeleton rows={5} cols={5} /> : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-900/50">
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Auteur</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Genre</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Copies</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-700/50">
              {books.map(b => (
                <tr key={b.bookId} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-sm">{b.bookId}</td>
                  <td className="px-4 py-3 text-white font-medium">{b.bookName}</td>
                  <td className="px-4 py-3 text-gray-300">{b.bookAuthor}</td>
                  <td className="px-4 py-3 text-gray-400">{b.bookGenre}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${b.noOfCopies > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {b.noOfCopies} {b.disponible ? '✅' : '🔒'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(b.bookId)} className="px-3 py-1 text-xs bg-red-600/20 text-red-400 border border-red-500/30 rounded-md hover:bg-red-600/40 transition-colors">
                      Supprimer
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

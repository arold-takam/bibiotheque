import { useState, useEffect } from 'react';
import { reservationService } from '../services/reservationService';
import { booksService } from '../services/booksService';
import { usersService } from '../services/usersService';
import type { Reservation, Book, User, ReservationStatut } from '../models/types';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Tooltip } from '../components/ui/Tooltip';
import toast from 'react-hot-toast';

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DISPONIBLE: 'bg-green-500/20 text-green-400 border-green-500/30',
  ANNULEE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  EXPIREE: 'bg-red-500/20 text-red-400 border-red-500/30',
  HONOREE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const STATUTS: ReservationStatut[] = ['TOUS', 'EN_ATTENTE', 'DISPONIBLE', 'ANNULEE', 'EXPIREE', 'HONOREE'];

export function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filtre, setFiltre] = useState<ReservationStatut>('TOUS');
  const [selectedBook, setSelectedBook] = useState<number | ''>('');
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [r, b, u] = await Promise.all([
        reservationService.getAll(filtre === 'TOUS' ? undefined : filtre),
        booksService.getAll(),
        usersService.getAll(),
      ]);
      setReservations(r);
      setBooks(b);
      setUsers(u);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filtre]);

  const handleCreate = async () => {
    if (!selectedBook || !selectedUser) return;
    setCreating(true);
    try {
      await reservationService.create({ livreId: Number(selectedBook), adherentId: Number(selectedUser) });
      toast.success('Réservation créée !');
      setSelectedBook('');
      setSelectedUser('');
      load();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de la création';
      toast.error(msg);
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Voulez-vous vraiment annuler cette réservation ?')) return;
    try {
      await reservationService.cancel(id);
      toast.success('Réservation annulée');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur annulation');
    }
  };

  // Update réservation : EN_ATTENTE → DISPONIBLE
  const handleDisponible = async (id: number) => {
    try {
      await reservationService.markDisponible(id);
      toast.success('Réservation passée à DISPONIBLE');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur transition disponible');
    }
  };

  // Update réservation : DISPONIBLE → HONOREE
  const handleHonorer = async (id: number) => {
    try {
      await reservationService.markHonoree(id);
      toast.success('Réservation honorée');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur transition honorer');
    }
  };

  const formValid = selectedBook !== '' && selectedUser !== '';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">📋 Gestion des réservations</h1>
        <button onClick={load} className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
          🔄 Rafraîchir
        </button>
      </div>

      {/* Formulaire de création */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">➕ Nouvelle réservation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Livre indisponible</label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">— Choisir un livre —</option>
              {books.map(b => (
                <option key={b.bookId} value={b.bookId}>
                  {b.bookName} ({b.noOfCopies} ex.) {b.disponible ? '✅' : '🔒'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Adhérent</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">— Choisir un adhérent —</option>
              {users.filter(u => u.role?.some(r => r.roleName === 'User')).map(u => (
                <option key={u.userId} value={u.userId}>
                  {u.name} ({u.username})
                </option>
              ))}
            </select>
          </div>
          <Tooltip content={!formValid ? 'Sélectionnez un livre et un adhérent' : 'Créer la réservation'}>
            <button
              onClick={handleCreate}
              disabled={!formValid || creating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {creating && <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
              {creating ? 'Création...' : 'Réserver'}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400 font-medium">Filtrer :</span>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
          {STATUTS.map(s => (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filtre === s
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : reservations.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="text-gray-400 mt-3">Aucune réservation</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Livre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Adhérent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Réservé le</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Expire le</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {reservations.map(r => (
                <tr key={r.reservationId} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{r.livreName}</td>
                  <td className="px-4 py-3 text-gray-300">{r.adherentName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${STATUT_COLORS[r.statut] || 'bg-gray-500/20 text-gray-400'}`}>
                      {r.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{r.dateReservation}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{r.dateExpiration}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {r.statut === 'EN_ATTENTE' && (
                      <button
                        onClick={() => handleDisponible(r.reservationId)}
                        className="px-3 py-1.5 text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 rounded-md transition-colors"
                      >
                        Marquer disponible
                      </button>
                    )}
                    {r.statut === 'DISPONIBLE' && (
                      <button
                        onClick={() => handleHonorer(r.reservationId)}
                        className="px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-md transition-colors"
                      >
                        Honorer
                      </button>
                    )}
                    {(r.statut === 'EN_ATTENTE' || r.statut === 'DISPONIBLE') && (
                      <button
                        onClick={() => handleCancel(r.reservationId)}
                        className="px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-md transition-colors"
                      >
                        Annuler
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

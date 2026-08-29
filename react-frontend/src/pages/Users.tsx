import { useState, useEffect } from 'react';
import { usersService } from '../services/usersService';
import type { User } from '../models/types';
import { TableSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', username: '', password: '', roleName: 'User' };

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    try { setUsers(await usersService.getAll()); }
    catch { toast.error('Erreur chargement utilisateurs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (u: User) => {
    setEditId(u.userId);
    setForm({ name: u.name, username: u.username, password: '', roleName: u.role?.[0]?.roleName || 'User' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const payload: any = {
      name: form.name,
      username: form.username,
      // le backend n'exige que roleName (il résout/assigne le roleId lui-même)
      role: [{ roleName: form.roleName }],
      ...(form.password ? { password: form.password } : {}),
    };
    try {
      if (editId === null) {
        await usersService.create(payload);
        toast.success('Utilisateur créé');
      } else {
        await usersService.update(editId, payload);
        toast.success('Utilisateur modifié');
      }
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (editId === null ? 'Erreur création' : 'Erreur modification'));
    }
  };

  const formValid = form.name && form.username && (editId !== null || form.password);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">👥 Utilisateurs</h1>
        <button onClick={() => { setShowForm(!showForm); if (showForm) setEditId(null); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
          {showForm ? '✕ Annuler' : '➕ Ajouter'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nom" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
            <input placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
            <input type="password" placeholder={editId === null ? 'Mot de passe' : 'Mot de passe (laisser vide = inchangé)'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
            <select value={form.roleName} onChange={e => setForm({...form, roleName: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <button onClick={handleSubmit} disabled={!formValid} className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors">
            {editId === null ? 'Créer' : 'Enregistrer les modifications'}
          </button>
        </div>
      )}

      {loading ? <TableSkeleton rows={5} cols={4} /> : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-900/50">
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Username</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Rôle</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase">Action</th>
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
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(u)} className="px-3 py-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-600/40 transition-colors">
                      Modifier
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

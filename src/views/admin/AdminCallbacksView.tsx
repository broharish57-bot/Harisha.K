import React, { useEffect, useState } from 'react';
import { PhoneCall, CheckCircle, Clock, Search, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface AdminCallbacksProps {
  navigate: (path: string) => void;
}

export const AdminCallbacksView: React.FC<AdminCallbacksProps> = ({ navigate }) => {
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCallbacks() {
      try {
        const data = await apiRequest('/api/admin/callbacks');
        setCallbacks(data);
      } catch (err) {
        console.error('Error loading callbacks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCallbacks();
  }, []);

  const filtered = callbacks.filter((c) => {
    if (filter !== 'ALL' && c.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.caller_phone?.includes(q) ||
      c.caller_name?.toLowerCase().includes(q) ||
      c.assigned_worker_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Master Telephony & Missed-Call Queue
        </h1>
        <p className="text-xs text-slate-500">
          Inbound missed calls and keypad phone SMS requests across all village clusters
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING', 'CALLED_BACK', 'RESOLVED', 'UNREACHABLE'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filter === f
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f === 'ALL' ? 'All Callbacks' : f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search phone, caller, worker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading callbacks...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
          No callbacks match the selected filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4">Caller Phone</th>
                <th className="py-3 px-4">Caller / Patient Name</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Assigned ASHA Worker</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Resolution Notes</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((cb) => (
                <tr key={cb.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750">
                  <td className="py-3 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {cb.caller_phone}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {cb.caller_name || 'Unregistered Caller'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 uppercase">
                      {cb.source}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {cb.assigned_worker_name ? (
                      <span className="font-semibold text-purple-600">{cb.assigned_worker_name}</span>
                    ) : (
                      <span className="text-amber-500 italic font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono">{cb.attempt_count}</td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                    {cb.resolution_notes || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cb.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cb.status === 'CALLED_BACK'
                          ? 'bg-blue-100 text-blue-800'
                          : cb.status === 'UNREACHABLE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cb.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

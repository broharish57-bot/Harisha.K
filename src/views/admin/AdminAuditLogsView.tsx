import React, { useEffect, useState } from 'react';
import { Activity, Shield, Search, RefreshCw, Lock } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface AuditLogsProps {
  navigate: (path: string) => void;
}

export const AdminAuditLogsView: React.FC<AuditLogsProps> = ({ navigate }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/audit-logs');
      setLogs(data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(q) ||
      l.target_type?.toLowerCase().includes(q) ||
      l.actor_role?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-purple-600" />
            Immutable Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Append-only security ledger tracking all user authentications, medical status modifications, and consent grants
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Filter by action (e.g. RECORD_CONSULTATION, BOOK_APPOINTMENT)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading audit trail...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
          No audit logs match your search.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold font-sans">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor Role</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750">
                  <td className="py-3 px-4 font-bold text-purple-700 dark:text-purple-400">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 uppercase">
                      {log.actor_role || 'system'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{log.target_type}</td>
                  <td className="py-3 px-4 max-w-sm truncate text-slate-600 dark:text-slate-300 text-[11px]">
                    {log.details || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {log.timestamp?.replace('T', ' ').slice(0, 19)}
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

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Clock } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface ActivityViewProps {
  navigate: (path: string) => void;
}

export const HealthWorkerActivityView: React.FC<ActivityViewProps> = ({ navigate }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await apiRequest('/api/health-worker/activity');
        setLogs(data);
      } catch (err) {
        console.error('Error fetching activity:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          My Activity & Accountability Trail
        </h1>
        <p className="text-xs text-slate-500">
          Immutable audit record of assisted patient registrations and callback interventions
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No activity recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {log.action}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {log.target_type}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      {log.details}
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-mono shrink-0">
                  {log.timestamp?.replace('T', ' ').slice(0, 19)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

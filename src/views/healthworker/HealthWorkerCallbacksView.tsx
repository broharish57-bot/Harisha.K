import React, { useEffect, useState } from 'react';
import { PhoneCall, CheckCircle, Clock, AlertCircle, X, Shield, Phone, MessageSquare } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface CallbacksViewProps {
  navigate: (path: string) => void;
}

export const HealthWorkerCallbacksView: React.FC<CallbacksViewProps> = ({ navigate }) => {
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status update modal
  const [selectedCallback, setSelectedCallback] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCallbacks = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/health-worker/callbacks');
      setCallbacks(data);
    } catch (err) {
      console.error('Error fetching callbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCallbacks();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallback) return;

    setSubmitting(true);
    try {
      await apiRequest(`/api/health-worker/callbacks/${selectedCallback.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          resolution_notes: resolutionNotes.trim(),
        }),
      });

      setSelectedCallback(null);
      setResolutionNotes('');
      await loadCallbacks();
    } catch (err: any) {
      alert(err.message || 'Failed to update callback status.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Resolved</span>;
      case 'CALLED_BACK':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Called Back</span>;
      case 'UNREACHABLE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Unreachable</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Village Missed-Call & SMS Callback Queue
        </h1>
        <p className="text-xs text-slate-500">
          Inbound requests from keypad phones and missed calls assigned to your village cluster
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading callback requests...</div>
      ) : callbacks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Callback Queue Clear</h3>
          <p>No pending missed calls or SMS callback requests for your village.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {callbacks.map((cb) => (
            <div
              key={cb.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                    {cb.source}
                  </span>
                  {getStatusBadge(cb.status)}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {cb.caller_name || 'Unregistered Caller'}
                </h3>
                <div className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                  {cb.caller_phone}
                </div>

                <div className="space-y-0.5 text-xs text-slate-500">
                  <div>Attempts Made: <strong>{cb.attempt_count}</strong></div>
                  <div>Received: <strong>{cb.created_at?.replace('T', ' ').slice(0, 16)}</strong></div>
                </div>

                {cb.resolution_notes && (
                  <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 italic">
                    "{cb.resolution_notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                <a
                  href={`tel:${cb.caller_phone}`}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>

                <button
                  onClick={() => {
                    setSelectedCallback(cb);
                    setNewStatus(cb.status === 'PENDING' ? 'RESOLVED' : cb.status);
                    setResolutionNotes(cb.resolution_notes || '');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Status Modal */}
      {selectedCallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-teal-600">{selectedCallback.caller_phone}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Update Callback Request</h3>
              </div>
              <button
                onClick={() => setSelectedCallback(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Callback Outcome Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="CALLED_BACK">Called Back (Spoke with caller, follow-up pending)</option>
                  <option value="RESOLVED">Resolved (Advised / Booked appointment / Query addressed)</option>
                  <option value="UNREACHABLE">Unreachable (Ringing unanswered / Switched off)</option>
                  <option value="ASSIGNED">Assigned (In progress)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes & Actions Taken *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Spoke with patient. Advised on clinic timing and scheduled assisted appointment."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCallback(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

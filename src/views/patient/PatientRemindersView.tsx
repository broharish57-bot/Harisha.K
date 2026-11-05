import React, { useEffect, useState } from 'react';
import { Bell, Plus, CheckCircle, Clock, Pill, Calendar, X, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useLanguage } from '../../lib/LanguageContext.tsx';

interface RemindersViewProps {
  navigate: (path: string) => void;
}

export const PatientRemindersView: React.FC<RemindersViewProps> = ({ navigate }) => {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add reminder modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [reminderType, setReminderType] = useState('MEDICATION');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('08:00 AM');
  const [channelPref, setChannelPref] = useState('BOTH');
  const [submitting, setSubmitting] = useState(false);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/patient/reminders');
      setReminders(data);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await apiRequest(`/api/patient/reminders/${id}/toggle`, { method: 'POST' });
      await loadReminders();
    } catch (err: any) {
      alert(err.message || 'Failed to update reminder.');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !dueTime) return;

    setSubmitting(true);
    try {
      await apiRequest('/api/patient/reminders', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          reminder_type: reminderType,
          due_date: dueDate,
          due_time: dueTime,
          channel_preference: channelPref,
        }),
      });

      setShowAddModal(false);
      setTitle('');
      await loadReminders();
    } catch (err: any) {
      alert(err.message || 'Failed to add reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Medication & Follow-Up Reminders
          </h1>
          <p className="text-xs text-slate-500">
            Never miss a dose or clinic follow-up visit. Alerts delivered via App and SMS.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Reminder</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Reminders Created</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Set reminders for daily tablet times, tonic doses, or immunization visits.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
          >
            Create First Reminder
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((rem) => {
            const isDone = Boolean(rem.is_completed);
            return (
              <div
                key={rem.id}
                className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(rem.id)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-teal-500'
                    }`}
                  >
                    {isDone && <CheckCircle className="w-4 h-4" />}
                  </button>

                  <div className="space-y-0.5">
                    <h4
                      className={`text-sm font-bold ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {rem.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {rem.due_date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {rem.due_time}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {rem.channel_preference} Alerts
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(rem.id)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0 cursor-pointer"
                >
                  {isDone ? 'Mark Incomplete' : 'Mark Done'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                Add Healthcare Reminder
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reminder Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol Tablet after lunch or Blood Sugar Check"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="MEDICATION">Medication (Tablet / Syrup)</option>
                  <option value="FOLLOW_UP">Doctor Follow-Up Visit</option>
                  <option value="VACCINATION">Child Immunization / Vaccine</option>
                  <option value="APPOINTMENT">Clinic Diagnostic Test</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:00 AM"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Channel *
                </label>
                <select
                  value={channelPref}
                  onChange={(e) => setChannelPref(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="BOTH">Both Smartphone App and SMS Text</option>
                  <option value="SMS">SMS Text Message Only</option>
                  <option value="IN_APP">In-App Notification Only</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

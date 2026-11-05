import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Check, Save, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface AvailabilityViewProps {
  navigate: (path: string) => void;
}

export const DoctorAvailabilityView: React.FC<AvailabilityViewProps> = ({ navigate }) => {
  const [schedule, setSchedule] = useState<any[]>([
    { day: 'Monday', active: true, startTime: '09:00 AM', endTime: '05:00 PM', maxPatients: 20 },
    { day: 'Tuesday', active: true, startTime: '09:00 AM', endTime: '05:00 PM', maxPatients: 20 },
    { day: 'Wednesday', active: true, startTime: '09:00 AM', endTime: '05:00 PM', maxPatients: 20 },
    { day: 'Thursday', active: true, startTime: '09:00 AM', endTime: '05:00 PM', maxPatients: 20 },
    { day: 'Friday', active: true, startTime: '09:00 AM', endTime: '05:00 PM', maxPatients: 20 },
    { day: 'Saturday', active: true, startTime: '09:00 AM', endTime: '01:00 PM', maxPatients: 10 },
    { day: 'Sunday', active: false, startTime: 'Closed', endTime: 'Closed', maxPatients: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await apiRequest('/api/doctor/availability');
        if (Array.isArray(res.schedule) && res.schedule.length > 0) {
          setSchedule(res.schedule);
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
      }
    }
    loadSchedule();
  }, []);

  const handleToggleDay = (index: number) => {
    const updated = [...schedule];
    updated[index].active = !updated[index].active;
    setSchedule(updated);
  };

  const handleChangeField = (index: number, field: string, value: any) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      await apiRequest('/api/doctor/availability', {
        method: 'PUT',
        body: JSON.stringify({ schedule }),
      });
      setSuccessMsg('Availability schedule updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Consultation Hours & Availability
          </h1>
          <p className="text-xs text-slate-500">
            Define your clinic consultation hours for rural patients and ASHA community workers
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Schedule'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="space-y-3">
          {schedule.map((item, idx) => (
            <div
              key={item.day}
              className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.active
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={() => handleToggleDay(idx)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white w-28">
                  {item.day}
                </span>
              </div>

              {item.active ? (
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">Hours:</span>
                    <input
                      type="text"
                      value={item.startTime}
                      onChange={(e) => handleChangeField(idx, 'startTime', e.target.value)}
                      className="w-24 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="text"
                      value={item.endTime}
                      onChange={(e) => handleChangeField(idx, 'endTime', e.target.value)}
                      className="w-24 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">Max Patients:</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={item.maxPatients}
                      onChange={(e) => handleChangeField(idx, 'maxPatients', Number(e.target.value))}
                      className="w-16 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-center font-mono"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Clinic Closed / Off Duty</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

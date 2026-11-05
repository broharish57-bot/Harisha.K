import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Filter, Stethoscope, Search, User } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface AdminAptProps {
  navigate: (path: string) => void;
}

export const AdminAppointmentsView: React.FC<AdminAptProps> = ({ navigate }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApts() {
      try {
        const data = await apiRequest('/api/admin/appointments');
        setAppointments(data);
      } catch (err) {
        console.error('Error loading appointments:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchApts();
  }, []);

  const filtered = appointments.filter((a) => {
    if (filter !== 'ALL' && a.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.reference_code?.toLowerCase().includes(q) ||
      a.patient_name?.toLowerCase().includes(q) ||
      a.doctor_name?.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Master System Appointment Ledger
        </h1>
        <p className="text-xs text-slate-500">
          Centralized consultation records across Smartphone, Keypad SMS, and ASHA assisted visits
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filter === f
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f === 'ALL' ? 'All Statuses' : f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search reference, patient, doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading master appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
          No appointments recorded.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750">
                  <td className="py-3 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {apt.reference_code}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{apt.patient_name}</div>
                    <div className="font-mono text-[11px] text-slate-400">{apt.patient_phone}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                    Dr. {apt.doctor_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{apt.department}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {apt.appointment_date} <br />
                    <span className="text-slate-400">{apt.time_slot}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700">
                      {apt.channel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : apt.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : apt.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {apt.status}
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

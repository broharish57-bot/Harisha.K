import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Stethoscope,
  Activity,
  FileText
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext.tsx';
import { apiRequest } from '../../lib/api.ts';

interface DoctorDashboardProps {
  navigate: (path: string) => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    stats: { totalAssigned: number; pendingRequests: number };
    todayAppointments: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctorData() {
      try {
        const res = await apiRequest('/api/doctor/dashboard');
        setData(res);
      } catch (err) {
        console.error('Error loading doctor dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctorData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5" />
            {user?.role === 'doctor_admin'
              ? 'Doctor Admin • Dual Clinical Practice & Administrative Control'
              : 'Clinician Portal • Verified Medical Practitioner'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dr. {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-normal">
            Primary Rural Telehealth & Clinic Care Dashboard. Review pending appointments, document clinical observations, issue digital prescriptions, and manage healthcare operations.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          {user?.role === 'doctor_admin' && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Admin Hub →</span>
            </button>
          )}
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Manage Appointments ({data?.stats.pendingRequests || 0} Pending)</span>
          </button>
          <button
            onClick={() => navigate('/doctor/availability')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Set Availability</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data?.stats.totalAssigned || 0}
            </div>
            <div className="text-xs text-slate-500 font-medium">Total Assigned Consultations</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data?.stats.pendingRequests || 0}
            </div>
            <div className="text-xs text-slate-500 font-medium">Requests Awaiting Review</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data?.todayAppointments?.length || 0}
            </div>
            <div className="text-xs text-slate-500 font-medium">Scheduled for Today</div>
          </div>
        </div>
      </div>

      {/* Today's Appointments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Today's Patient Schedule
          </h2>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            All Appointments <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading today's visits...</div>
        ) : !data?.todayAppointments || data.todayAppointments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Consultations Scheduled for Today</h3>
            <p className="text-xs text-slate-500">You can review upcoming and pending requests in the appointments tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-600">{apt.reference_code}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {apt.time_slot}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{apt.patient_name}</h4>
                  <p className="text-xs text-slate-500">
                    {apt.village_or_town} • {apt.patient_phone}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                    "{apt.reason_summary}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                  <button
                    onClick={() => navigate(`/doctor/consultations/${apt.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                  >
                    Start Consultation
                  </button>
                  <button
                    onClick={() => navigate(`/doctor/patients/${apt.patient_id}`)}
                    className="font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                  >
                    Medical History →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

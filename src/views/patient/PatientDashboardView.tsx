import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Pill,
  Bell,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  CheckCircle,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext.tsx';
import { useLanguage } from '../../lib/LanguageContext.tsx';
import { apiRequest } from '../../lib/api.ts';

interface PatientDashboardProps {
  navigate: (path: string) => void;
}

export const PatientDashboardView: React.FC<PatientDashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState<{
    upcomingAppointments: any[];
    prescriptions: any[];
    records: any[];
    reminders: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await apiRequest('/api/patient/dashboard');
        setData(res);
      } catch (err) {
        console.error('Error loading patient dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Confirmed</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending Review</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600/30 border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Patient Portal • {user?.village_or_town}, {user?.district}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Namaste, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed font-normal">
            Your centralized healthcare access record. Manage appointments, view clinical prescriptions, and access medical records anytime.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => navigate('/patient/appointments/new')}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Doctor Visit</span>
          </button>
          <button
            onClick={() => navigate('/patient/records')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Upload Reports</span>
          </button>
        </div>
      </div>

      {/* Grid: Upcoming Appointments & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment Card (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              Active & Upcoming Consultations
            </h2>
            <button
              onClick={() => navigate('/patient/appointments')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View All ({data?.upcomingAppointments?.length || 0}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
              Loading appointments...
            </div>
          ) : !data?.upcomingAppointments || data.upcomingAppointments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">No upcoming appointments scheduled.</p>
              <button
                onClick={() => navigate('/patient/appointments/new')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 cursor-pointer"
              >
                Schedule First Consultation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                        {apt.reference_code}
                      </span>
                      {getStatusBadge(apt.status)}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Dr. {apt.doctor_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{apt.department} • {apt.qualification}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                      "{apt.reason_summary}"
                    </p>
                  </div>

                  <div className="sm:text-right space-y-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                    <div className="flex sm:justify-end items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{apt.appointment_date}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{apt.time_slot}</div>
                    <button
                      onClick={() => navigate(`/patient/appointments`)}
                      className="text-xs font-bold text-teal-600 hover:underline pt-1 block sm:inline-block cursor-pointer"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medication & Follow-up Reminders (Col 3) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Active Reminders
            </h2>
            <button
              onClick={() => navigate('/patient/reminders')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700"
            >
              Manage
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            {!data?.reminders || data.reminders.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No pending reminders.</p>
            ) : (
              data.reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs"
                >
                  <Pill className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 grow">
                    <strong className="text-slate-800 dark:text-white block">{rem.title}</strong>
                    <span className="text-[11px] text-slate-500 block">
                      Due: {rem.due_date} at {rem.due_time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Prescriptions & Medical Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescriptions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              Recent Doctor Prescriptions
            </h3>
            <button
              onClick={() => navigate('/patient/prescriptions')}
              className="text-xs font-bold text-teal-600 hover:underline"
            >
              All Prescriptions →
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            {!data?.prescriptions || data.prescriptions.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No prescriptions issued yet. Consult a doctor to receive prescriptions.</p>
            ) : (
              data.prescriptions.map((pr) => (
                <div
                  key={pr.id}
                  onClick={() => navigate('/patient/prescriptions')}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Dr. {pr.doctor_name}</h4>
                    <span className="text-[11px] text-slate-500">Visit Date: {pr.appointment_date}</span>
                  </div>
                  <span className="text-teal-600 font-bold">View Medication →</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reports */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Diagnostic Reports & Scans
            </h3>
            <button
              onClick={() => navigate('/patient/records')}
              className="text-xs font-bold text-teal-600 hover:underline"
            >
              Upload / View All →
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            {!data?.records || data.records.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No diagnostic reports uploaded yet.</p>
            ) : (
              data.records.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => navigate('/patient/records')}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                    <span className="text-[11px] text-slate-500">{rec.file_name} • {(rec.file_size / 1024).toFixed(1)} KB</span>
                  </div>
                  <span className="text-blue-600 font-bold">Download →</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

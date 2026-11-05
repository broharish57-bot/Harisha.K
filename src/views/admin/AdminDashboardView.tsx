import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  Stethoscope,
  PhoneCall,
  Calendar,
  MessageSquare,
  Activity,
  Plus,
  ArrowRight,
  AlertCircle,
  Database,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../lib/AuthContext.tsx';
import { SupabaseConnectModal } from '../../components/SupabaseConnectModal.tsx';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [supabaseOpen, setSupabaseOpen] = useState(false);
  const [data, setData] = useState<{
    metrics: {
      totalPatients: number;
      totalDoctors: number;
      verifiedDoctors: number;
      totalHealthWorkers: number;
      totalAppointments: number;
      pendingCallbacks: number;
      smsCount: number;
    };
    recentAudit: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const res = await apiRequest('/api/admin/dashboard');
        setData(res);
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Admin Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            System Administration • Raichur & Yadgir Cluster
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            RuralCare Platform Operations
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 leading-relaxed font-normal">
            Monitor healthcare access metrics across web, feature-phone SMS gateways, missed-call telephony webhooks, and ASHA field workers.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          {user?.role === 'doctor_admin' && (
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Clinical Doctor Hub →</span>
            </button>
          )}
          <button
            onClick={() => setSupabaseOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Supabase Cloud Sync</span>
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Doctor / Staff</span>
          </button>
          <button
            onClick={() => navigate('/admin/communications')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>SMS & Telemetry</span>
          </button>
        </div>
      </div>

      {/* Metrics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Registered Patients</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {data?.metrics.totalPatients || 0}
          </div>
          <span className="text-[11px] text-teal-600 font-semibold block">Across 14 villages</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Verified Doctors</span>
          <div className="text-2xl font-black text-emerald-600">
            {data?.metrics.verifiedDoctors || 0} <span className="text-xs text-slate-400">/ {data?.metrics.totalDoctors || 0}</span>
          </div>
          <button
            onClick={() => navigate('/admin/users')}
            className="text-[11px] text-teal-600 hover:underline font-semibold block cursor-pointer"
          >
            Verification Queue →
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Consultations</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {data?.metrics.totalAppointments || 0}
          </div>
          <button
            onClick={() => navigate('/admin/appointments')}
            className="text-[11px] text-teal-600 hover:underline font-semibold block cursor-pointer"
          >
            View Master Ledger →
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Pending Callbacks</span>
          <div className="text-2xl font-black text-amber-600">
            {data?.metrics.pendingCallbacks || 0}
          </div>
          <button
            onClick={() => navigate('/admin/callbacks')}
            className="text-[11px] text-amber-600 hover:underline font-semibold block cursor-pointer"
          >
            Callback Ledger →
          </button>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => navigate('/admin/users')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-purple-500 transition cursor-pointer space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">User & Staff Management</h3>
          <p className="text-xs text-slate-500">
            Verify doctor medical licenses, assign ASHA workers to village clusters, manage credentials.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/communications')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-teal-500 transition cursor-pointer space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">SMS & Telephony Webhook Status</h3>
          <p className="text-xs text-slate-500">
            Inspect live SMS gateway connectivity, inbound webhook event logs, and missed-call telemetry.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/audit-logs')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-500 transition cursor-pointer space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Access Audit Trail</h3>
          <p className="text-xs text-slate-500">
            Immutable log of all user registrations, logins, status changes, and consent records.
          </p>
        </div>

        <div
          onClick={() => setSupabaseOpen(true)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-teal-500 transition cursor-pointer space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Supabase Cloud Database</h3>
          <p className="text-xs text-slate-500">
            Configure Supabase URL/keys, test latency, run SQL migrations, and sync local records.
          </p>
        </div>
      </div>

      {/* Recent Audit Log Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            Recent Security & Operational Audit Events
          </h2>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            All Audit Logs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700 text-xs">
          {!data?.recentAudit || data.recentAudit.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No audit logs recorded yet.</p>
          ) : (
            data.recentAudit.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4 font-mono">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {log.target_type}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">{log.timestamp?.replace('T', ' ').slice(0, 19)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Supabase Connect Modal */}
      <SupabaseConnectModal isOpen={supabaseOpen} onClose={() => setSupabaseOpen(false)} />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Users,
  PhoneCall,
  UserPlus,
  CheckCircle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext.tsx';
import { apiRequest } from '../../lib/api.ts';

interface HealthWorkerDashboardProps {
  navigate: (path: string) => void;
}

export const HealthWorkerDashboardView: React.FC<HealthWorkerDashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    stats: { pendingCallbacks: number; assistedPatientsCount: number; assignedVillage: string };
    villagePatients: any[];
    activeCallbacks: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHWData() {
      try {
        const res = await apiRequest('/api/health-worker/dashboard');
        setData(res);
      } catch (err) {
        console.error('Error fetching health worker dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHWData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-800 via-teal-800 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            Village Health Worker Portal • ASHA / ANM
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-normal">
            Assigned Village Cluster: <strong className="text-white underline">{data?.stats.assignedVillage || user?.village_or_town}</strong>. Facilitate assisted patient registrations with recorded consent and resolve missed-call callback requests.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => navigate('/health-worker/patients/new')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assisted Patient Registration</span>
          </button>
          <button
            onClick={() => navigate('/health-worker/callbacks')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Callback Queue ({data?.stats.pendingCallbacks || 0})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data?.stats.pendingCallbacks || 0}
            </div>
            <div className="text-xs text-slate-500 font-medium">Pending Callbacks</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data?.stats.assistedPatientsCount || 0}
            </div>
            <div className="text-xs text-slate-500 font-medium">Patients Assisted & Enrolled</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
              {data?.stats.assignedVillage || user?.village_or_town}
            </div>
            <div className="text-xs text-slate-500 font-medium">Coverage Area Cluster</div>
          </div>
        </div>
      </div>

      {/* Active Callbacks Queue Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-amber-600" />
            Urgent Callbacks Awaiting Resolution
          </h2>
          <button
            onClick={() => navigate('/health-worker/callbacks')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            All Callbacks <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading callbacks...</div>
        ) : !data?.activeCallbacks || data.activeCallbacks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">All Callbacks Resolved</h3>
            <p className="text-xs text-slate-500">No pending missed-call or SMS callback requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.activeCallbacks.slice(0, 6).map((cb) => (
              <div
                key={cb.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {cb.source}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {cb.created_at?.split('T')[1]?.slice(0, 5)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{cb.caller_name || 'Caller'}</h4>
                  <div className="text-xs font-mono font-bold text-teal-600">{cb.caller_phone}</div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <a
                    href={`tel:${cb.caller_phone}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Patient</span>
                  </a>
                  <button
                    onClick={() => navigate('/health-worker/callbacks')}
                    className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
                  >
                    Update Status →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Village Patients Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            Registered Village Patients ({data?.stats.assignedVillage})
          </h2>
          <button
            onClick={() => navigate('/health-worker/patients')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            Village Directory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          {!data?.villagePatients || data.villagePatients.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No patients registered in this village yet. Use assisted registration to enroll villagers.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              {data.villagePatients.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{p.full_name}</h4>
                    <span className="text-slate-500 font-mono">{p.phone} • Emergency: {p.emergency_contact_phone || 'None'}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Enrolled: {p.created_at?.split('T')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

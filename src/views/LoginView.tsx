import React, { useState } from 'react';
import { HeartPulse, Lock, Phone, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Stethoscope, Sparkles } from 'lucide-react';
import { useAuth, type UserSession } from '../lib/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { useLanguage } from '../lib/LanguageContext.tsx';

interface LoginViewProps {
  navigate: (path: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ navigate }) => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('+919876511111');
  const [password, setPassword] = useState('Doctor@RuralCare2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest<{ token: string; user: UserSession }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      login(data.token, data.user);

      // Route by role
      switch (data.user.role) {
        case 'doctor_admin':
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'health_worker':
          navigate('/health-worker/dashboard');
          break;
        default:
          navigate('/patient/dashboard');
          break;
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (ident: string, pass: string) => {
    setIdentifier(ident);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-teal-600 text-white items-center justify-center shadow-lg shadow-teal-600/30">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Sign In to RuralCare Connect
        </h2>
        <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
          Access for Patients, Doctors, Doctor Admins, Health Workers, and Directors
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl border border-slate-200 dark:border-slate-700 sm:rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="+919876511111 or doctor.admin@ruralcare.in"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[11px] text-teal-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Staff Credentials Info for Easy Evaluation */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              1-Click Quick Login Presets:
            </span>

            {/* Doctor Admin (New Role) */}
            <button
              type="button"
              onClick={() => setPreset('+919876511111', 'Doctor@RuralCare2026')}
              className="w-full p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-left text-xs flex items-center justify-between hover:bg-indigo-100 transition cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200">Dr. Ananya Rao</span>
                  <span className="bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                    Doctor Admin
                  </span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono block mt-0.5">
                  +919876511111 • Dual Clinical & Admin Access
                </span>
              </div>
              <span className="text-xs text-indigo-600 font-bold">Use →</span>
            </button>

            {/* Field Doctor */}
            <button
              type="button"
              onClick={() => setPreset('+919876522222', 'Doctor@2026')}
              className="w-full p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left text-xs flex items-center justify-between hover:bg-emerald-100 transition cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200">Dr. Ramesh Patil</span>
                  <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                    Doctor
                  </span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono block mt-0.5">
                  +919876522222 • Senior Medical Officer
                </span>
              </div>
              <span className="text-xs text-emerald-600 font-bold">Use →</span>
            </button>

            {/* System Admin */}
            <button
              type="button"
              onClick={() => setPreset('+919876500000', 'Admin@RuralCare2026')}
              className="w-full p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-left text-xs flex items-center justify-between hover:bg-purple-100 transition cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-purple-950 dark:text-purple-200">System Admin</span>
                  <span className="bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                    Admin
                  </span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono block mt-0.5">
                  +919876500000 • State Health Mission Director
                </span>
              </div>
              <span className="text-xs text-purple-600 font-bold">Use →</span>
            </button>

            {/* ASHA Health Worker */}
            <button
              type="button"
              onClick={() => setPreset('+919876533333', 'Asha@RuralCare2026')}
              className="w-full p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left text-xs flex items-center justify-between hover:bg-amber-100 transition cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-950 dark:text-amber-200">Laxmi Gabbur</span>
                  <span className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                    ASHA Worker
                  </span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono block mt-0.5">
                  +919876533333 • Village Assisted Care Lead
                </span>
              </div>
              <span className="text-xs text-amber-600 font-bold">Use →</span>
            </button>
          </div>

          <div className="text-center text-xs text-slate-700 dark:text-slate-200">
            <span>New user or doctor? </span>
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-teal-600 hover:underline cursor-pointer"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

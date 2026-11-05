import React, { useState } from 'react';
import {
  HeartPulse,
  Menu,
  X,
  Globe,
  User,
  LogOut,
  Calendar,
  FileText,
  Bell,
  Users,
  ShieldCheck,
  PhoneCall,
  Activity,
  Layers,
  MessageSquare,
  Sparkles,
  Database,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext.tsx';
import { useLanguage } from '../lib/LanguageContext.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { SupabaseConnectModal } from './SupabaseConnectModal.tsx';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, logout } = useAuth();
  const { lang, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'doctor_admin':
        return <span className="bg-indigo-100 text-indigo-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-300">Doctor Admin</span>;
      case 'doctor':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">Dr. / Doctor</span>;
      case 'health_worker':
        return <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300">ASHA / Worker</span>;
      case 'admin':
        return <span className="bg-purple-100 text-purple-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-purple-300">Admin</span>;
      default:
        return <span className="bg-teal-100 text-teal-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-teal-300">Patient</span>;
    }
  };

  const navLinks = () => {
    if (!user) {
      return [
        { label: t.navHome, path: '/' },
        { label: 'Urgent Care (112)', path: '/emergency' },
        { label: 'Keypad SMS & Call', path: '/#channels' },
        { label: t.navLogin, path: '/login' },
        { label: t.navRegister, path: '/register', primary: true },
      ];
    }

    if (user.role === 'patient') {
      return [
        { label: t.navDashboard, path: '/patient/dashboard' },
        { label: t.navAppointments, path: '/patient/appointments' },
        { label: t.navPrescriptions, path: '/patient/prescriptions' },
        { label: t.navRecords, path: '/patient/records' },
        { label: t.navReminders, path: '/patient/reminders' },
        { label: t.navMessages, path: '/patient/messages' },
      ];
    }

    if (user.role === 'doctor') {
      return [
        { label: t.navDashboard, path: '/doctor/dashboard' },
        { label: t.navAppointments, path: '/doctor/appointments' },
        { label: t.navPatients, path: '/doctor/patients' },
        { label: t.navAvailability, path: '/doctor/availability' },
        { label: t.navMessages, path: '/doctor/messages' },
      ];
    }

    if (user.role === 'health_worker') {
      return [
        { label: t.navDashboard, path: '/health-worker/dashboard' },
        { label: 'Assisted Reg.', path: '/health-worker/patients/new', primary: true },
        { label: 'Village Patients', path: '/health-worker/patients' },
        { label: t.navCallbacks, path: '/health-worker/callbacks' },
        { label: 'Activity Logs', path: '/health-worker/activity' },
      ];
    }

    if (user.role === 'doctor_admin') {
      return [
        { label: 'Doctor Hub', path: '/doctor/dashboard' },
        { label: 'Appointments', path: '/doctor/appointments' },
        { label: 'My Patients', path: '/doctor/patients' },
        { label: 'Admin Hub', path: '/admin/dashboard' },
        { label: 'All Users', path: '/admin/users' },
        { label: 'All Appointments', path: '/admin/appointments' },
        { label: 'Audit Logs', path: '/admin/audit-logs' },
      ];
    }

    if (user.role === 'admin') {
      return [
        { label: t.navDashboard, path: '/admin/dashboard' },
        { label: t.navUsers, path: '/admin/users' },
        { label: t.navAppointments, path: '/admin/appointments' },
        { label: t.navCallbacks, path: '/admin/callbacks' },
        { label: 'Communications & SMS', path: '/admin/communications' },
        { label: t.navAuditLogs, path: '/admin/audit-logs' },
      ];
    }

    return [];
  };

  const links = navLinks();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:bg-teal-700 transition">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  RuralCare
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-bold text-lg">Connect</span>
              </div>
              <p className="text-[10px] text-slate-700 dark:text-slate-200 font-semibold leading-none">
                India Rural Health Mission
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {links.map((link) => {
              const isActive = currentPath === link.path;
              if (link.primary) {
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="ml-2 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    {link.label}
                  </button>
                );
              }
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                      : 'text-slate-800 hover:text-teal-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Cloud Connect Button */}
            <button
              onClick={() => setSupabaseModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50/80 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Supabase Cloud Database Settings & Sync"
            >
              <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="hidden sm:inline">Supabase</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
                title="Change language / ಭಾಷೆಯನ್ನು ಬದಲಿಸಿ / भाषा बदलें"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-semibold uppercase">{lang}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 text-xs">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                      lang === 'en' ? 'font-bold text-teal-700' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>English</span>
                    {lang === 'en' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('kn');
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                      lang === 'kn' ? 'font-bold text-teal-700' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>ಕನ್ನಡ (Kannada)</span>
                    {lang === 'kn' && <span className="text-teal-600">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('hi');
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                      lang === 'hi' ? 'font-bold text-teal-700' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>हिन्दी (Hindi)</span>
                    {lang === 'hi' && <span className="text-teal-600">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* User Session Info & Logout */}
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => navigate('/account')}
                  className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="View Account"
                >
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[120px]">
                      {user.full_name}
                    </div>
                    <div>{getRoleBadge(user.role)}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-1.5 rounded-lg text-slate-700 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                  title={t.navLogout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 cursor-pointer"
                >
                  {t.navLogin}
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                >
                  {t.navRegister}
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-4 space-y-1">
          {user && (
            <div className="px-3 py-2 mb-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user.full_name}</p>
                <p className="text-[11px] text-slate-500">{user.phone} • {user.village_or_town}</p>
              </div>
              <div>{getRoleBadge(user.role)}</div>
            </div>
          )}

          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                navigate(link.path);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                currentPath === link.path
                  ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {link.label}
            </button>
          ))}

          {user ? (
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
                navigate('/login');
              }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.navLogout}</span>
            </button>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                {t.navLogin}
              </button>
              <button
                onClick={() => {
                  navigate('/register');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-xs font-bold rounded-lg bg-teal-600 text-white"
              >
                {t.navRegister}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Supabase Connect Modal */}
      <SupabaseConnectModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </header>
  );
};

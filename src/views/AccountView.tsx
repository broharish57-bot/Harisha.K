import React, { useState } from 'react';
import { User, Phone, MapPin, Globe, Shield, Bell, Check, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthContext.tsx';
import { useLanguage } from '../lib/LanguageContext.tsx';
import { apiRequest } from '../lib/api.ts';

interface AccountViewProps {
  navigate: (path: string) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ navigate }) => {
  const { user, logout, refreshUser } = useAuth();
  const { lang, setLanguage, t } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-xs text-slate-500">Please log in to manage your account.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Account Settings</h1>
          <p className="text-xs text-slate-500">Manage your profile, village details, and communication preferences</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t.navLogout}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{user.full_name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 uppercase">
                {user.role}
              </span>
              <span className="text-xs text-slate-500 font-mono">{user.phone}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Village / Town</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              {user.village_or_town}, {user.district}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">State</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{user.state}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Emergency Contact</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {user.emergency_contact_phone || 'None recorded'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Account Status</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Verified Patient Profile
            </span>
          </div>
        </div>
      </div>

      {/* Language Preferences */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-600" />
          Preferred Language
        </h3>
        <p className="text-xs text-slate-500">
          This language will be used for web portal navigation, SMS appointment alerts, and health worker communication.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { id: 'en', name: 'English', native: 'English' },
            { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
            { id: 'hi', name: 'Hindi', native: 'हिन्दी' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLanguage(l.id as any);
                setSuccessMsg(`Language updated to ${l.name}`);
                setTimeout(() => setSuccessMsg(null), 3000);
              }}
              className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                lang === l.id
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div>
                <span className="block font-medium">{l.native}</span>
                <span className="text-[11px] text-slate-400">{l.name}</span>
              </div>
              {lang === l.id && <span className="text-teal-600 font-bold">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-600" />
          SMS Notification Preferences
        </h3>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <p>
            You are enrolled to receive appointment booking confirmations, reminder alerts, and consultation reference codes via ordinary SMS.
          </p>
          <p className="text-[11px] text-slate-500">
            Note: In accordance with medical privacy rules, SMS texts never contain confidential medical diagnosis notes or prescription lists.
          </p>
          <div className="pt-2 text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
            To opt out of SMS at any time, reply <strong>STOP</strong> to our SMS gateway. Reply <strong>START</strong> to re-enable.
          </div>
        </div>
      </div>
    </div>
  );
};

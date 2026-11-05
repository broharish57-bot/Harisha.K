import React from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext.tsx';

export const EmergencyBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 text-white shadow-inner">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-center md:text-left">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-200 animate-pulse" />
          <div>
            <span className="font-extrabold uppercase tracking-wide bg-red-950/40 px-2 py-0.5 rounded text-[11px] mr-2">
              {t.emergencyTitle}
            </span>
            <span className="opacity-95">{t.emergencyDisclaimer}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-red-700 hover:bg-red-50 font-bold rounded-full shadow-sm text-xs transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>112 (Police / Fire / Emergency)</span>
          </a>
          <a
            href="tel:108"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-full shadow-sm text-xs transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>108 (Ambulance)</span>
          </a>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, HeartPulse, Hospital, Clock, MapPin } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext.tsx';

interface EmergencyViewProps {
  navigate: (path: string) => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ navigate }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* High-visibility Warning Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 text-white shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-8 h-8 text-amber-200 animate-pulse shrink-0" />
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
            Urgent Medical Care & Emergency Hotlines
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-red-50 leading-relaxed font-medium">
          CRITICAL NOTICE: RuralCare Connect, SMS text messaging, and telemedicine are <strong>NOT emergency response services</strong>. In case of acute, life-threatening symptoms, immediate trauma, stroke, poisoning, or heavy bleeding, dial the toll-free emergency hotlines below or proceed immediately to the nearest Community Health Center.
        </p>
      </div>

      {/* Emergency Hotlines Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="tel:112"
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-red-500 shadow-md hover:bg-red-50/50 dark:hover:bg-red-950/20 transition flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest">National Unified Helpline</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-600 group-hover:animate-bounce" />
              112
            </h3>
            <p className="text-xs text-slate-500">Police, Fire, and All-India Integrated Emergency</p>
          </div>
          <span className="px-3.5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs">
            Dial 112
          </span>
        </a>

        <a
          href="tel:108"
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-500 shadow-md hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Ambulance & Medical Transit</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Hospital className="w-5 h-5 text-amber-600 group-hover:animate-bounce" />
              108
            </h3>
            <p className="text-xs text-slate-500">Government Free Emergency Ambulance Transport</p>
          </div>
          <span className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
            Dial 108
          </span>
        </a>

        <a
          href="tel:1091"
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-teal-600 uppercase tracking-widest">Women & Child Helpline</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">1091</h3>
            <p className="text-xs text-slate-500">Emergency support for women and pediatric rescue</p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs">
            Dial 1091
          </span>
        </a>

        <a
          href="tel:104"
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Arogyavani Tele-Triage</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">104</h3>
            <p className="text-xs text-slate-500">State 24/7 Health Advice & PHC Location Guidance</p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs">
            Dial 104
          </span>
        </a>
      </div>

      {/* Critical Red Flag Symptoms Checklist */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          When to Seek Immediate Hospital Emergency Care (Red Flags)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong>• Severe Chest Pain / Pressure:</strong> Radiating to arm, jaw, or accompanied by cold sweating (Suspected Myocardial Infarction).
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong>• Snake Bite or Scorpion Sting:</strong> Immobilize limb, keep calm, DO NOT cut or tourniquet, rush immediately to nearest anti-venom center.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong>• Sudden Breathing Stridor / Cyanosis:</strong> Bluish lips, inability to speak full sentences, or severe acute asthma.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong>• Acute Maternal Labor / Hemorrhage:</strong> Premature rupture of membranes, excessive bleeding, or severe abdominal spasm.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong>• High Pediatric Fever with Convulsions:</strong> Infant seizure, unresponsiveness, or sunken fontanelle dehydration.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong>• Severe Head Trauma / Loss of Consciousness:</strong> Accidents with persistent vomiting, pupillary asymmetry, or confusion.
          </div>
        </div>
      </div>

      {/* Primary Health Centers Directory */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-teal-600" />
          Nearest 24/7 Government Health Facilities (Raichur & Yadgir Cluster)
        </h2>
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Raichur District Teaching Hospital (RIMS)</h4>
              <p className="text-slate-500">Hyderabad Road, Raichur • Emergency Casualty Open 24/7</p>
            </div>
            <a href="tel:08532238488" className="text-teal-600 font-bold hover:underline">
              Call (08532) 238488
            </a>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Community Health Center (CHC) Devadurga</h4>
              <p className="text-slate-500">Main Road, Devadurga • Maternal & Anti-Venom Available</p>
            </div>
            <a href="tel:08537250100" className="text-teal-600 font-bold hover:underline">
              Call (08537) 250100
            </a>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Primary Health Center (PHC) Gabbur</h4>
              <p className="text-slate-500">Deodurga Taluk, Gabbur • 24/7 Labor Room & Stabilization</p>
            </div>
            <a href="tel:108" className="text-teal-600 font-bold hover:underline">
              Ambulance Link: 108
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

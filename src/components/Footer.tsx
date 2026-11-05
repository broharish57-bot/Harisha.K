import React from 'react';
import { HeartPulse, PhoneCall, MessageSquare, Shield, HelpCircle } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext.tsx';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Mission */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span>RuralCare Connect</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Serving rural Indian villages across smartphones, feature-phone SMS menus, missed-call requests, and Village Health Workers.
            </p>
            <div className="pt-1 text-[11px] text-teal-400 font-semibold">
              Primary Health Centers: Raichur & Yadgir Cluster
            </div>
          </div>

          {/* Col 2: Emergency Helplines */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-400" />
              Emergency Helplines (24/7)
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <a href="tel:112" className="hover:text-white flex items-center justify-between">
                  <span>National Emergency Helpline:</span>
                  <strong className="text-red-400 font-mono">112</strong>
                </a>
              </li>
              <li>
                <a href="tel:108" className="hover:text-white flex items-center justify-between">
                  <span>Medical Emergency & Ambulance:</span>
                  <strong className="text-amber-400 font-mono">108</strong>
                </a>
              </li>
              <li>
                <a href="tel:1091" className="hover:text-white flex items-center justify-between">
                  <span>Women & Child Emergency:</span>
                  <strong className="text-teal-400 font-mono">1091</strong>
                </a>
              </li>
              <li>
                <a href="tel:104" className="hover:text-white flex items-center justify-between">
                  <span>Health Information Helpline:</span>
                  <strong className="text-emerald-400 font-mono">104</strong>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Keypad Phone SMS Menu */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
              Keypad SMS Shortcodes
            </h4>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 font-mono text-[11px] space-y-1">
              <div className="text-teal-300 font-bold">SMS to +91 98765 00000:</div>
              <div>• <strong>HELP</strong> - View Main Menu</div>
              <div>• <strong>1</strong> - Request Appointment</div>
              <div>• <strong>2</strong> - Check Status</div>
              <div>• <strong>3</strong> - Request ASHA Callback</div>
              <div>• <strong>4</strong> - 112 Urgent Guidance</div>
              <div>• <strong>STOP</strong> - Opt Out of SMS</div>
            </div>
          </div>

          {/* Col 4: Platform & Compliance */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Compliance & Legal
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => navigate('/emergency')}
                  className="text-red-400 hover:underline font-semibold"
                >
                  Urgent Care Guidance (112)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/privacy')}
                  className="hover:text-white hover:underline"
                >
                  Privacy Policy (Health Data)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/terms')}
                  className="hover:text-white hover:underline"
                >
                  Terms of Service & Telemedicine Rules
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/offline')}
                  className="hover:text-white hover:underline"
                >
                  PWA Offline Sync & Capabilities
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} RuralCare Connect. Unified Healthcare Access for Rural Communities in India.</p>
          <p className="text-slate-400">
            Aligned with India ABDM guidelines • English / ಕನ್ನಡ / हिन्दी
          </p>
        </div>
      </div>
    </footer>
  );
};

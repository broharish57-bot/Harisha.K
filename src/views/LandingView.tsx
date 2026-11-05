import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  Smartphone,
  PhoneCall,
  MessageSquare,
  Users,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  Activity,
  MapPin,
  Sparkles,
  Award
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext.tsx';
import { apiRequest } from '../lib/api.ts';

interface LandingViewProps {
  navigate: (path: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ navigate }) => {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick SMS Simulator test state to test the real backend SMS endpoint
  const [testPhone, setTestPhone] = useState('+919876543210');
  const [testSmsBody, setTestSmsBody] = useState('HELP');
  const [testSmsReply, setTestSmsReply] = useState<string | null>(null);
  const [smsSending, setSmsSending] = useState(false);

  // Quick Missed Call test state to test real backend missed-call webhook
  const [missedCallPhone, setMissedCallPhone] = useState('+919876543210');
  const [missedCallStatus, setMissedCallStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [depts, docs] = await Promise.all([
          apiRequest('/api/system/departments').catch(() => []),
          apiRequest('/api/system/doctors').catch(() => []),
        ]);
        setDepartments(depts);
        setDoctors(docs);
      } catch (err) {
        console.error('Landing load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsSending(true);
    setTestSmsReply(null);
    try {
      const res = await fetch('/api/sms/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          From: testPhone,
          Body: testSmsBody,
          MessageSid: `SIM-SMS-${Date.now()}`,
        }),
      });
      const text = await res.text();
      setTestSmsReply(text);
    } catch (err: any) {
      setTestSmsReply(`Error testing SMS: ${err.message}`);
    } finally {
      setSmsSending(false);
    }
  };

  const handleTestMissedCall = async () => {
    setMissedCallStatus('Triggering missed call event to backend webhook...');
    try {
      const res = await fetch('/api/telephony/missed-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CallSid: `CALL-EVT-${Date.now()}`,
          From: missedCallPhone,
          timestamp: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      setMissedCallStatus(
        json.success
          ? `Missed call registered! Callback Request ID: ${json.callbackId?.slice(0, 8)} (Status: Queued for Village Health Worker)`
          : `Failed: ${json.message}`
      );
    } catch (err: any) {
      setMissedCallStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-teal-800 to-slate-900 text-white py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Unified Rural Healthcare Access • India
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Quality healthcare for <span className="text-teal-300">every village</span> household.
            </h1>

            <p className="text-base sm:text-lg text-teal-100/90 leading-relaxed font-normal">
              Whether you have a modern smartphone, a basic keypad feature-phone, or need assisted in-person registration from your local ASHA worker—RuralCare Connect ensures direct access to qualified medical specialists.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition flex items-center gap-2 cursor-pointer"
              >
                <span>Book Doctor Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/emergency')}
                className="px-5 py-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Urgent Care & 112 Help</span>
              </button>

              <a
                href="#channels"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-xs transition flex items-center gap-2"
              >
                <span>Keypad SMS & Missed-Call Guide</span>
              </a>
            </div>

            {/* Quick Stats Banner */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-teal-700/50 text-xs">
              <div>
                <div className="text-xl font-extrabold text-white">4 Channels</div>
                <div className="text-teal-200">Web, SMS, Call, ASHA</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-white">3 Languages</div>
                <div className="text-teal-200">ಕನ್ನಡ, हिन्दी, English</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-white">100% Free</div>
                <div className="text-teal-200">Rural Health Mission</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-white">24/7 Hotline</div>
                <div className="text-teal-200">112 Emergency Ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Access Channels Section */}
      <section id="channels" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Four Unified Ways to Access Care
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
            One centralized patient database connecting all rural healthcare channels seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Channel 1: Web / PWA */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Channel 1</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">Smartphone PWA App</h3>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
              Full interactive portal for patients: schedule doctor appointments, view prescriptions, securely upload medical lab reports, and manage reminders with offline sync.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
            >
              Register on Web <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Channel 2: Keypad Phone SMS */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Channel 2</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">Keypad SMS Service</h3>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
              No internet required. Send <strong>HELP</strong> to book consultations, check appointment status, or request callbacks in Kannada, Hindi, or English.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-[11px] font-mono text-slate-700 dark:text-slate-300">
              SMS <strong>HELP</strong> to <strong className="text-blue-600">+91 98765 00000</strong>
            </div>
          </div>

          {/* Channel 3: Missed Call Service */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Channel 3</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">Missed-Call Callback</h3>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
              Zero-cost missed-call service. Give a missed call to our toll-free rural number; our telephony webhook captures the event and assigns an ASHA worker to call back.
            </p>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[11px] font-mono text-amber-800 dark:text-amber-300">
              Toll-Free: <strong>1800 200 4567</strong>
            </div>
          </div>

          {/* Channel 4: Village Health Worker (ASHA) */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Channel 4</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">ASHA Assisted Visits</h3>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
              For illiterate and elderly citizens: Accredited Social Health Activists (ASHA) perform doorstep assisted registration with explicit verbal/written consent.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
            >
              Health Worker Login <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Telephony & SMS Live Webhook Tester (Operating Rules 3 & 6: Working Features) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest">Live Gateway Integration</span>
              <h3 className="text-xl font-bold text-white mt-1">SMS & Missed-Call Webhook Test Console</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Test the real server-side SMS state-machine router and Missed-Call webhook pipeline directly.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-300">Backend Webhook Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SMS Webhook Tester */}
            <div className="space-y-4 bg-slate-800/60 p-5 rounded-xl border border-slate-700/50">
              <h4 className="text-sm font-bold text-teal-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Test Inbound SMS Webhook (/api/sms/inbound)
              </h4>
              <p className="text-xs text-slate-300">
                Simulates an incoming SMS from a rural feature phone. Tests Kannada (ಕನ್ನಡ), Hindi (हिंदी), English, HELP, and booking workflows.
              </p>

              <form onSubmit={handleTestSms} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Sender Mobile Number</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Incoming SMS Text</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testSmsBody}
                      onChange={(e) => setTestSmsBody(e.target.value)}
                      placeholder="e.g. HELP, 1, 2, 4, LANG KN"
                      className="grow bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={smsSending}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      {smsSending ? 'Sending...' : 'Send SMS'}
                    </button>
                  </div>
                </div>

                {/* Shortcut Command Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['HELP', '1', '2', '3', '4', 'LANG KN', 'LANG HI', 'STOP'].map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => setTestSmsBody(cmd)}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-mono text-[10px] cursor-pointer"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>

                {testSmsReply && (
                  <div className="mt-3 p-3 rounded-lg bg-teal-950/60 border border-teal-800 text-teal-200 font-mono text-xs whitespace-pre-wrap">
                    <div className="text-[10px] text-teal-400 font-bold uppercase mb-1">Server SMS Outbound Reply:</div>
                    {testSmsReply}
                  </div>
                )}
              </form>
            </div>

            {/* Missed-Call Webhook Tester */}
            <div className="space-y-4 bg-slate-800/60 p-5 rounded-xl border border-slate-700/50">
              <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <PhoneCall className="w-4 h-4" />
                Test Inbound Missed-Call Webhook (/api/telephony/missed-call)
              </h4>
              <p className="text-xs text-slate-300">
                Simulates an incoming telephony webhook event. Deduplicates call IDs, matches village health workers, and queues a callback request.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Caller Mobile Number</label>
                  <input
                    type="text"
                    value={missedCallPhone}
                    onChange={(e) => setMissedCallPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestMissedCall}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition cursor-pointer"
                >
                  Simulate Inbound Missed Call
                </button>

                {missedCallStatus && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-200 font-mono text-xs">
                    <div className="text-[10px] text-amber-400 font-bold uppercase mb-1">Telephony Response:</div>
                    {missedCallStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Specialties / Departments Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Medical Specialties & Departments
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium mt-0.5">
              Available across primary health centers and telehealth consultation rooms.
            </p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="self-start sm:self-auto px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
          >
            Select Department & Book
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{dept.name}</h4>
                <p className="text-xs text-slate-700 dark:text-slate-200 font-medium mt-1">
                  Consultation available via smartphone video, voice, or ASHA tele-clinic.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verified Doctors Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Verified Doctors & Clinical Specialists
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium mt-0.5">
            All doctors are verified by administrators with valid Medical Council license registrations.
          </p>
        </div>

        {doctors.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
            No doctors registered in the system yet. Administrators can register verified doctors from the admin portal.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                      {doc.department}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{doc.full_name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{doc.qualification}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal">{doc.bio || 'General Consultation & Preventive Healthcare Specialist.'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">{doc.years_of_experience} yrs experience</span>
                  <button
                    onClick={() => navigate('/register')}
                    className="font-bold text-teal-600 hover:text-teal-700"
                  >
                    Book Visit →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

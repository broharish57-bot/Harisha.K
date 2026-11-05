import React from 'react';
import { Shield, Lock, FileText, WifiOff, AlertTriangle, ArrowLeft } from 'lucide-react';

interface InfoViewProps {
  type: 'privacy' | 'terms' | 'unauthorized' | 'offline';
  navigate: (path: string) => void;
}

export const PrivacyTermsView: React.FC<InfoViewProps> = ({ type, navigate }) => {
  if (type === 'unauthorized') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied (403)</h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          You do not have authorization to view this clinical resource or role portal.
          RuralCare Connect enforces strict server-side role boundaries and clinical confidentiality rules.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (type === 'offline') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
            <WifiOff className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">PWA Offline Mode & Sync</h1>
            <p className="text-xs text-slate-500">How offline appointment requests work in low-connectivity villages</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Resilient Care Coordination</h3>
          <p>
            RuralCare Connect is built with a Progressive Web App (PWA) service worker and an IndexedDB offline queue.
            When internet connectivity is intermittent:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Non-sensitive Actions Queued:</strong> Appointment booking requests and callback requests are assigned unique client request IDs and queued locally.</li>
            <li><strong>Automatic Synchronization:</strong> As soon as network connectivity is restored, the client securely authenticates and submits queued requests to <code>/api/sync/offline-batch</code>.</li>
            <li><strong>Conflict & Duplicate Prevention:</strong> The server verifies timestamps, deduplicates request IDs, and prevents double-booking of doctor slots.</li>
            <li><strong>Security on Shared Devices:</strong> Medical reports and clinical consultations are never stored unencrypted in local browser storage, and all local queues are purged on user sign-out.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (type === 'privacy') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-teal-100 text-teal-700">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Health Data Privacy Policy</h1>
            <p className="text-xs text-slate-500">In accordance with the Digital Personal Data Protection Act & Ayushman Bharat Digital Mission</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">1. Scope of Collected Information</h3>
          <p>
            We collect only the minimum required patient demographic details (Name, Phone number, Village/Town, District)
            necessary to coordinate healthcare with treating clinicians and Village Health Workers.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-sm">2. Strict Role-Based Clinical Isolation</h3>
          <p>
            Doctor consultation notes and prescriptions are strictly confidential. Village Health Workers (ASHA/ANM) can only access minimal demographic details and assigned callback tasks; they cannot read or alter clinical doctor notes or diagnostic prescriptions.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-sm">3. Confidentiality on SMS Channels</h3>
          <p>
            In compliance with patient confidentiality laws, ordinary SMS text messages will <strong>never</strong> contain medical diagnoses, confidential clinical findings, or prescription drug lists. SMS is strictly restricted to scheduling references, status updates, and emergency guidance.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-sm">4. Patient Consent & Revocation</h3>
          <p>
            Every assisted registration by an ASHA worker records explicit patient or guardian verbal/written consent in an immutable system ledger. Patients have the right to revoke consent and opt out of SMS communications at any time by replying <code>STOP</code>.
          </p>
        </div>
      </div>
    );
  }

  // Terms of Service
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Terms of Telemedicine Service</h1>
          <p className="text-xs text-slate-500">Board of Governors in Supersession of Medical Council of India Guidelines</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">1. Nature of Telemedicine & Primary Coordination</h3>
        <p>
          Telemedicine consultations on RuralCare Connect are provided by registered medical practitioners.
          A telemedicine consultation is not a substitute for in-person physical examination where physical clinical assessment, palpation, or urgent surgical intervention is required.
        </p>

        <h3 className="font-bold text-slate-900 dark:text-white text-sm">2. Non-Emergency Disclaimer</h3>
        <p>
          Telemedicine and SMS interactions must NOT be relied upon during acute emergencies.
          For emergency conditions (severe trauma, acute myocardial symptoms, severe poisoning, pediatric seizures), patients must contact 112 or 108 or proceed immediately to the nearest Primary Health Center.
        </p>

        <h3 className="font-bold text-slate-900 dark:text-white text-sm">3. Doctor Discretion</h3>
        <p>
          The consulting registered doctor retains full professional discretion to recommend an immediate in-person hospital referral if they determine the patient's condition cannot be safely evaluated remotely.
        </p>

        <h3 className="font-bold text-slate-900 dark:text-white text-sm">4. Prohibition of Automated Diagnosis</h3>
        <p>
          RuralCare Connect does not automatically generate treatments or medical prescriptions. All medical advice and prescriptions are issued exclusively by verified, human clinical doctors.
        </p>
      </div>
    </div>
  );
};

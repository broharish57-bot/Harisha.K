import React, { useEffect, useState } from 'react';
import { UserPlus, User, Phone, MapPin, Globe, CheckCircle, AlertCircle, ArrowLeft, Calendar, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../lib/AuthContext.tsx';

interface AssistedRegProps {
  navigate: (path: string) => void;
}

export const HealthWorkerAssistedRegView: React.FC<AssistedRegProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    preferred_language: 'kn',
    village_or_town: user?.village_or_town || 'Gabbur',
    district: 'Raichur',
    emergency_contact_phone: '',
    consent_confirmed: true,
    initial_appointment_dept: 'General Medicine',
    initial_appointment_reason: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  useEffect(() => {
    apiRequest('/api/system/departments')
      .then((depts) => setDepartments(depts))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim() || !formData.village_or_town.trim()) {
      setErrorMsg('Please enter patient name, mobile phone number, and village.');
      return;
    }

    if (!formData.consent_confirmed) {
      setErrorMsg('Explicit patient or guardian verbal/written consent is mandatory for assisted registration.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessResult(null);

    try {
      const res = await apiRequest('/api/health-worker/assisted-registration', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSuccessResult(res);
      setFormData({
        full_name: '',
        phone: '',
        preferred_language: 'kn',
        village_or_town: user?.village_or_town || 'Gabbur',
        district: 'Raichur',
        emergency_contact_phone: '',
        consent_confirmed: true,
        initial_appointment_dept: 'General Medicine',
        initial_appointment_reason: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Assisted registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/health-worker/dashboard')}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Assisted Patient Registration (ASHA Portal)
          </h1>
          <p className="text-xs text-slate-500">
            Enroll rural patients with verifiable verbal or written consent into the unified database
          </p>
        </div>
      </div>

      {successResult && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Patient Enrolled Successfully with Consent Recorded!</span>
          </div>
          <p>
            Patient ID: <code className="font-mono">{successResult.patient_id}</code>
          </p>
          {successResult.appointment_reference && (
            <p className="font-bold text-teal-800 dark:text-teal-300">
              Appointment Booked! Reference Code: <code className="font-mono">{successResult.appointment_reference}</code>
            </p>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md space-y-5 text-xs">
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Assisting Worker: <strong>{user?.full_name}</strong> (ASHA Worker ID: {user?.id.slice(0, 8)}).
            All assisted registrations are logged in the immutable security audit ledger.
          </span>
        </div>

        {/* Patient Demographics */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs border-b border-slate-100 dark:border-slate-700 pb-2">
            1. Patient Information
          </h3>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Patient Full Name (ರೋಗಿಯ ಪೂರ್ಣ ಹೆಸರು / पूरा नाम) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Smt. Renuka Bai"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Patient Mobile Number (ಮೊಬೈಲ್ ಸಂಖ್ಯೆ) *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Communication Language *
              </label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Village / Town (ಗ್ರಾಮ / ಊರು) *
              </label>
              <input
                type="text"
                required
                value={formData.village_or_town}
                onChange={(e) => setFormData({ ...formData, village_or_town: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                District (ಜಿಲ್ಲೆ) *
              </label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Family Member Emergency Contact
            </label>
            <input
              type="tel"
              placeholder="Son / Daughter / Spouse phone number"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Optional Immediate Consultation Booking */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs border-b border-slate-100 dark:border-slate-700 pb-2">
            2. Initial Consultation Request (Optional)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Department
              </label>
              <select
                value={formData.initial_appointment_dept}
                onChange={(e) => setFormData({ ...formData, initial_appointment_dept: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="General Medicine">General Medicine / ಸಾಮಾನ್ಯ ಚಿಕಿತ್ಸೆ</option>
                <option value="Pediatrics">Pediatrics & Child Care / ಮಕ್ಕಳ ಆರೈಕೆ</option>
                <option value="Obstetrics & Gynecology">Maternal Care / ಮಾತೃ ಆರೈಕೆ</option>
                <option value="Orthopedics">Orthopedics / ಮೂಳೆ ತಜ್ಞರು</option>
                <option value="Ophthalmology">Eye Care / ನೇತ್ರ ತಜ್ಞರು</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chief Health Complaints
              </label>
              <input
                type="text"
                placeholder="e.g. Joint pain, chronic cough, fever"
                value={formData.initial_appointment_reason}
                onChange={(e) => setFormData({ ...formData, initial_appointment_reason: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Consent Section */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={formData.consent_confirmed}
              onChange={(e) => setFormData({ ...formData, consent_confirmed: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-slate-700 dark:text-slate-200 font-semibold leading-normal">
              I verify that the patient or their legal guardian has given explicit verbal or written consent for assisted registration, health record creation, and telemedicine coordination under the RuralCare mission.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>{loading ? 'Recording Patient & Consent...' : 'Complete Assisted Registration'}</span>
        </button>
      </form>
    </div>
  );
};

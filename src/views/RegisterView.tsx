import React, { useState } from 'react';
import {
  HeartPulse,
  User,
  Phone,
  MapPin,
  Globe,
  Lock,
  ArrowRight,
  AlertCircle,
  Stethoscope,
  ShieldCheck,
  Building2,
  Award
} from 'lucide-react';
import { useAuth, type UserSession } from '../lib/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { useLanguage } from '../lib/LanguageContext.tsx';

interface RegisterViewProps {
  navigate: (path: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ navigate }) => {
  const { login } = useAuth();
  const { lang, t } = useLanguage();

  const [role, setRole] = useState<'patient' | 'doctor' | 'doctor_admin'>('patient');

  const [formData, setFormData] = useState({
    phone: '',
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    preferred_language: lang,
    village_or_town: '',
    district: 'Raichur',
    state: 'Karnataka',
    emergency_contact_phone: '',
    department: 'General Medicine',
    license_number: '',
    qualification: 'MBBS, MD',
    years_of_experience: '5',
    bio: '',
    consent_confirmed: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!formData.consent_confirmed) {
      setError('You must accept the terms of service and healthcare data consent.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest<{ token: string; user: UserSession }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          phone: formData.phone,
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          preferred_language: formData.preferred_language,
          village_or_town: formData.village_or_town,
          district: formData.district,
          state: formData.state,
          emergency_contact_phone: formData.emergency_contact_phone,
          role,
          department: formData.department,
          license_number: formData.license_number || `MED-${Date.now().toString().slice(-5)}`,
          qualification: formData.qualification,
          years_of_experience: Number(formData.years_of_experience) || 5,
          bio: formData.bio,
        }),
      });

      login(data.token, data.user);

      if (role === 'doctor_admin' || role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-teal-600 text-white items-center justify-center shadow-lg shadow-teal-600/30">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {t.navRegister}
        </h2>
        <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
          Join RuralCare Connect to schedule appointments, consult doctors, and manage healthcare services.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl border border-slate-200 dark:border-slate-700 sm:rounded-2xl sm:px-10 space-y-6">
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Account Type (ಖಾತೆಯ ಪ್ರಕಾರವನ್ನು ಆರಿಸಿ)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  role === 'patient'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-teal-600" />
                <span>Patient</span>
                <span className="text-[10px] font-normal text-slate-700 dark:text-slate-200">ರೋಗಿ</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  role === 'doctor'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Doctor</span>
                <span className="text-[10px] font-normal text-slate-700 dark:text-slate-200">ವೈದ್ಯರು</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('doctor_admin')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  role === 'doctor_admin'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Doctor Admin</span>
                <span className="text-[10px] font-normal text-slate-700 dark:text-slate-200">ವೈದ್ಯ ನಿರ್ವಾಹಕ</span>
              </button>
            </div>
            {role === 'doctor_admin' && (
              <p className="mt-2 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-200 dark:border-indigo-800">
                ⭐ <strong>Doctor Admin Privileges:</strong> Full access to examine patients, appoint walk-in patients, prescribe medications, as well as administrative authority to view audit logs, users, and manage Supabase sync.
              </p>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name ({role === 'patient' ? 'ರೋಗಿಯ ಪೂರ್ಣ ಹೆಸರು' : 'ವೈದ್ಯರ ಹೆಸರು'}) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={role === 'patient' ? 'e.g. Basavaraj Patil' : 'e.g. Dr. Ramesh Patil'}
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Mobile & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (ಮೊಬೈಲ್ ಸಂಖ್ಯೆ) *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Language (ಭಾಷೆ / भाषा)
                </label>
                <div className="relative">
                  <select
                    value={formData.preferred_language}
                    onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value as any })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="en">English</option>
                  </select>
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Email (Optional for Patient, Recommended for Doctor) */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address ({role !== 'patient' ? 'Recommended for Staff' : 'Optional'})
              </label>
              <input
                type="email"
                placeholder="name@ruralcare.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Doctor Credentials Fields (Shown only if doctor or doctor_admin) */}
            {(role === 'doctor' || role === 'doctor_admin') && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span>Medical Credentials & Department</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department (ವಿಭಾಗ) *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="General Medicine">General Medicine</option>
                      <option value="Pediatrics">Pediatrics (Child Health)</option>
                      <option value="Obstetrics & Gynecology">Obstetrics & Gynecology (Maternal)</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      License / Council Reg. No. *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KMC-58291"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Medical Qualification
                    </label>
                    <input
                      type="text"
                      placeholder="MBBS, MD"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.years_of_experience}
                      onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Village & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Village / Town (ಗ್ರಾಮ / ಊರು) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gabbur"
                    value={formData.village_or_town}
                    onChange={(e) => setFormData({ ...formData, village_or_town: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  District (ಜಿಲ್ಲೆ) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Raichur / Yadgir"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Emergency Contact (For Patient) */}
            {role === 'patient' && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Contact Phone (ತುರ್ತು ಸಂಪರ್ಕ ಸಂಖ್ಯೆ)
                </label>
                <input
                  type="tel"
                  placeholder="Family member phone number"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password (ಗುಪ್ತಪದ) *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consent_confirmed}
                  onChange={(e) => setFormData({ ...formData, consent_confirmed: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-200 leading-normal font-normal">
                  I agree to RuralCare Connect Terms of Service, Privacy Policy, and patient data confidentiality guidelines.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4 ${
                role === 'doctor_admin'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : role === 'doctor'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              <span>
                {loading
                  ? 'Creating Account...'
                  : role === 'doctor_admin'
                  ? 'Register as Doctor Admin'
                  : role === 'doctor'
                  ? 'Register as Clinical Doctor'
                  : 'Register Patient Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-700 dark:text-slate-200 pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>Already registered? </span>
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-teal-600 hover:underline cursor-pointer"
            >
              Sign in to your account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

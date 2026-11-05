import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Stethoscope,
  User,
  AlertCircle,
  ArrowRight,
  Plus,
  X,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../lib/AuthContext.tsx';

interface DoctorAppointmentsProps {
  navigate: (path: string) => void;
}

export const DoctorAppointmentsView: React.FC<DoctorAppointmentsProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Walk-In Patient Booking Modal State
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookSuccess, setBookSuccess] = useState<string | null>(null);

  const [walkinData, setWalkinData] = useState({
    patient_name: '',
    patient_phone: '',
    village_or_town: '',
    district: 'Raichur',
    appointment_date: new Date().toISOString().split('T')[0],
    time_slot: '10:00 AM - 11:00 AM',
    reason_summary: '',
    department: 'General Medicine',
  });

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/doctor/appointments');
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleStatusUpdate = async (aptId: string, status: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/api/doctor/appointments/${aptId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, status_notes: `Status set to ${status} by clinician.` }),
      });
      await loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookError(null);
    setBookSuccess(null);
    setBookLoading(true);

    try {
      const res = await apiRequest<{ success: boolean; reference_code: string; id: string; message: string }>(
        '/api/doctor/appointments/book-for-patient',
        {
          method: 'POST',
          body: JSON.stringify(walkinData),
        }
      );

      setBookSuccess(`Appointment confirmed! Reference Code: ${res.reference_code}`);
      await loadAppointments();
      setTimeout(() => {
        setBookModalOpen(false);
        setBookSuccess(null);
        setWalkinData({
          patient_name: '',
          patient_phone: '',
          village_or_town: '',
          district: 'Raichur',
          appointment_date: new Date().toISOString().split('T')[0],
          time_slot: '10:00 AM - 11:00 AM',
          reason_summary: '',
          department: 'General Medicine',
        });
      }, 1500);
    } catch (err: any) {
      setBookError(err.message || 'Failed to book appointment for patient.');
    } finally {
      setBookLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Doctor Appointment Management
            </h1>
            {user?.role === 'doctor_admin' && (
              <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-xs font-extrabold px-2 py-0.5 rounded-full border border-indigo-300">
                Doctor Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            Review consultation requests, appoint walk-in patients, and record confidential clinical notes
          </p>
        </div>

        {/* Action Button: Appoint Patient */}
        <button
          onClick={() => setBookModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Appoint Walk-In Patient</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 text-xs">
        {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filter === f
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {f === 'ALL' ? 'All Requests' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-3">
          <p>No appointments found matching this status filter.</p>
          <button
            onClick={() => setBookModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Appoint a Patient Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                    {apt.reference_code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      apt.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : apt.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : apt.status === 'CANCELLED'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  {apt.patient_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {apt.village_or_town} • Phone: <strong className="font-mono">{apt.patient_phone}</strong>
                </p>

                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {apt.appointment_date} • {apt.time_slot}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 italic">
                  "{apt.reason_summary}"
                </div>

                <div className="text-[11px] text-slate-400">
                  Channel: <strong>{apt.channel}</strong> • Language: <strong>{apt.preferred_language?.toUpperCase() || 'EN'}</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2 text-xs">
                {apt.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusUpdate(apt.id, 'CONFIRMED')}
                      disabled={actionLoading}
                      className="grow py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(apt.id, 'REJECTED')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {apt.status === 'CONFIRMED' && (
                  <button
                    onClick={() => navigate(`/doctor/consultations/${apt.id}`)}
                    className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Conduct Consultation & Prescribe</span>
                  </button>
                )}

                <button
                  onClick={() => navigate(`/doctor/patients/${apt.patient_id}`)}
                  className="w-full text-center py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold cursor-pointer"
                >
                  View Longitudinal Patient History →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Walk-In Patient Modal */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Appoint Walk-In / Referred Patient
                  </h3>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    Immediately creates and confirms an appointment in your clinic schedule
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBookModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookWalkin} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
              {bookError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookError}</span>
                </div>
              )}

              {bookSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{bookSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Somanna Gowda"
                    value={walkinData.patient_name}
                    onChange={(e) => setWalkinData({ ...walkinData, patient_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Patient Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={walkinData.patient_phone}
                    onChange={(e) => setWalkinData({ ...walkinData, patient_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Village / Town
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gabbur"
                    value={walkinData.village_or_town}
                    onChange={(e) => setWalkinData({ ...walkinData, village_or_town: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={walkinData.department}
                    onChange={(e) => setWalkinData({ ...walkinData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Consultation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={walkinData.appointment_date}
                    onChange={(e) => setWalkinData({ ...walkinData, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time Slot *
                  </label>
                  <select
                    value={walkinData.time_slot}
                    onChange={(e) => setWalkinData({ ...walkinData, time_slot: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
                    <option value="02:30 PM - 03:30 PM">02:30 PM - 03:30 PM</option>
                    <option value="03:30 PM - 04:30 PM">03:30 PM - 04:30 PM</option>
                    <option value="04:30 PM - 05:30 PM">04:30 PM - 05:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Symptoms / Reason for Visit *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Acute fever for 3 days, body ache, dry cough"
                  value={walkinData.reason_summary}
                  onChange={(e) => setWalkinData({ ...walkinData, reason_summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBookModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookLoading}
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {bookLoading ? 'Scheduling...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

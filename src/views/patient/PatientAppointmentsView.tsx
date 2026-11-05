import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  MapPin,
  ArrowRight,
  X,
  WifiOff
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useLanguage } from '../../lib/LanguageContext.tsx';

interface AppointmentsViewProps {
  navigate: (path: string) => void;
  openNewModalByDefault?: boolean;
}

export const PatientAppointmentsView: React.FC<AppointmentsViewProps> = ({
  navigate,
  openNewModalByDefault = false,
}) => {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // New appointment modal
  const [showNewModal, setShowNewModal] = useState(openNewModalByDefault);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [aptDate, setAptDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [aptTimeSlot, setAptTimeSlot] = useState('10:00 AM - 11:00 AM');
  const [reasonSummary, setReasonSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected appointment details modal
  const [selectedApt, setSelectedApt] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/patient/appointments');
      setAppointments(data);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // Load metadata for booking
    apiRequest('/api/system/departments')
      .then((res) => {
        setDepartments(res);
        if (res.length > 0) setSelectedDept(res[0].name);
      })
      .catch(() => {});

    apiRequest('/api/system/doctors')
      .then((res) => {
        setDoctors(res);
        if (res.length > 0) setSelectedDoctorId(res[0].id);
      })
      .catch(() => {});
  }, []);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedDoctorId || !selectedDept || !aptDate || !aptTimeSlot || !reasonSummary.trim()) {
      setErrorMsg('Please complete all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/api/patient/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          department: selectedDept,
          appointment_date: aptDate,
          time_slot: aptTimeSlot,
          reason_summary: reasonSummary.trim(),
        }),
      });

      if (res.queued) {
        setSuccessMsg(res.message);
      } else {
        setSuccessMsg(`Appointment booked successfully! Reference Code: ${res.reference_code}`);
      }

      setReasonSummary('');
      setShowNewModal(false);
      await loadAppointments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelApt = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(true);
    try {
      await apiRequest(`/api/patient/appointments/${id}/cancel`, { method: 'POST' });
      setSelectedApt(null);
      await loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  const timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header & New Booking Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            My Doctor Appointments
          </h1>
          <p className="text-xs text-slate-500">
            Track status, schedule new visits, and manage consultation history
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 text-xs">
        {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filter === f
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {f === 'ALL' ? 'All Visits' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Appointment Cards List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">No appointments found matching this filter.</p>
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

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Dr. {apt.doctor_name}
                </h3>
                <p className="text-xs text-slate-500">{apt.department}</p>

                <div className="space-y-1 pt-1 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.appointment_date} • {apt.time_slot}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Channel: <strong>{apt.channel}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">
                  "{apt.reason_summary}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedApt(apt)}
                  className="font-bold text-teal-600 hover:underline cursor-pointer"
                >
                  View Details
                </button>

                {apt.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancelApt(apt.id)}
                    className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book New Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                Book Doctor Consultation
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
              {/* Department */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Specialty *
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Doctor *
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.full_name} ({doc.department} - {doc.qualification})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Consultation Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Available Time Slot *
                  </label>
                  <select
                    value={aptTimeSlot}
                    onChange={(e) => setAptTimeSlot(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Visit / Main Symptoms *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your health symptoms, fever duration, cough, joint pain, etc."
                  value={reasonSummary}
                  onChange={(e) => setReasonSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                • <strong>Double Booking Protection:</strong> Time slots are checked in real-time.
                <br />• <strong>Offline Support:</strong> If offline, your request will be queued in IndexedDB and synchronized once reconnected.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-teal-600">{selectedApt.reference_code}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Appointment Details</h3>
              </div>
              <button onClick={() => setSelectedApt(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-teal-700 dark:text-teal-400">{selectedApt.status}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Doctor</span>
                <p className="font-bold text-slate-900 dark:text-white">Dr. {selectedApt.doctor_name}</p>
                <p className="text-slate-500">{selectedApt.department} • {selectedApt.qualification}</p>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Scheduled Time</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedApt.appointment_date} at {selectedApt.time_slot}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Consultation Reason</span>
                <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedApt.reason_summary}
                </p>
              </div>

              {selectedApt.status_notes && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Doctor Notes</span>
                  <p className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200">
                    {selectedApt.status_notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
              {selectedApt.status === 'PENDING' && (
                <button
                  onClick={() => handleCancelApt(selectedApt.id)}
                  disabled={cancelling}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              )}
              <button
                onClick={() => setSelectedApt(null)}
                className="ml-auto px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

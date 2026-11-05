import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  Pill,
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface ConsultationViewProps {
  appointmentId: string;
  navigate: (path: string) => void;
}

interface MedicationRow {
  name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  food_instructions: string;
  warnings?: string;
}

export const DoctorConsultationView: React.FC<ConsultationViewProps> = ({
  appointmentId,
  navigate,
}) => {
  const [appointment, setAppointment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Clinical form state
  const [symptoms, setSymptoms] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  // Prescription state
  const [medications, setMedications] = useState<MedicationRow[]>([
    {
      name: 'Paracetamol',
      dosage: '650mg',
      frequency: '1-0-1 (Morning & Night)',
      duration_days: 5,
      food_instructions: 'Take after meals with warm water',
      warnings: 'Do not exceed 3 tablets in 24 hours',
    },
  ]);
  const [generalAdvice, setGeneralAdvice] = useState('Maintain adequate hydration with boiled water and oral rehydration fluids. Adequate rest.');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointment() {
      try {
        const apts = await apiRequest('/api/doctor/appointments');
        const found = apts.find((a: any) => a.id === appointmentId);
        if (found) {
          setAppointment(found);
          setSymptoms(found.reason_summary || '');
        } else {
          setErrorMsg('Appointment not found or not assigned to you.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading appointment');
      } finally {
        setLoading(false);
      }
    }
    fetchAppointment();
  }, [appointmentId]);

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      {
        name: '',
        dosage: '500mg',
        frequency: '1-0-1 (Morning & Night)',
        duration_days: 5,
        food_instructions: 'Take after meals',
        warnings: '',
      },
    ]);
  };

  const removeMedicationRow = (index: number) => {
    setMedications(medications.filter((_, idx) => idx !== index));
  };

  const updateMedication = (index: number, field: keyof MedicationRow, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || !clinicalNotes.trim()) {
      setErrorMsg('Please record observed symptoms and confidential clinical examination notes.');
      return;
    }

    if (medications.some((m) => !m.name.trim())) {
      setErrorMsg('Please fill in the name for all prescribed medications or remove empty rows.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Record Consultation
      const consultRes = await apiRequest('/api/doctor/consultations', {
        method: 'POST',
        body: JSON.stringify({
          appointment_id: appointmentId,
          symptoms_observed: symptoms.trim(),
          clinical_notes: clinicalNotes.trim(),
          follow_up_date: followUpDate || null,
          follow_up_instructions: followUpInstructions.trim(),
        }),
      });

      // 2. Issue Prescription
      if (medications.length > 0) {
        await apiRequest('/api/doctor/prescriptions', {
          method: 'POST',
          body: JSON.stringify({
            consultation_id: consultRes.id,
            medications,
            general_advice: generalAdvice.trim(),
          }),
        });
      }

      alert('Consultation recorded and prescription issued successfully!');
      navigate('/doctor/appointments');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading consultation record...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            Clinical Consultation & Prescription
          </h1>
          <p className="text-xs text-slate-500">
            Document patient examination findings and generate legally valid digital prescription
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Patient Demographic Card */}
      {appointment && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400">
              {appointment.reference_code}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {appointment.patient_name}
            </h3>
            <p className="text-slate-500">
              Village: <strong>{appointment.village_or_town}</strong> • Phone: <strong className="font-mono">{appointment.patient_phone}</strong>
            </p>
          </div>

          <div className="space-y-1 sm:text-right">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {appointment.appointment_date} • {appointment.time_slot}
            </div>
            <div className="text-slate-500">Department: {appointment.department}</div>
            <button
              onClick={() => navigate(`/doctor/patients/${appointment.patient_id}`)}
              className="text-teal-600 font-bold hover:underline cursor-pointer block sm:inline-block pt-1"
            >
              Inspect Past Lab Reports & History →
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Clinical Observations & Notes */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <FileText className="w-4 h-4 text-teal-600" />
            1. Clinical Symptoms & Confidential Examination Notes
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Symptoms Observed & Vitals (Fever, BP, Pulse, Cough duration, etc.) *
              </label>
              <textarea
                required
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. High fever for 4 days (101°F), dry cough, pulse 82 bpm, BP 120/80 mmHg."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Doctor's Clinical Notes & Assessment (Confidential to Doctor & Patient) *
              </label>
              <textarea
                required
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="e.g. Acute Upper Respiratory Tract Infection with mild bronchitis. Chest clear on auscultation. Advised warm fluids and hydration."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Follow-Up Review Date (Optional)
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Follow-Up Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Return if fever persists beyond 48 hours"
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Prescription Builder */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              2. Digital Prescription Formulation (Rx)
            </h3>
            <button
              type="button"
              onClick={addMedicationRow}
              className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center gap-1 hover:bg-teal-100 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medicine</span>
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Medicine #{idx + 1}
                  </span>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(idx)}
                      className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1">Drug Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paracetamol, Amoxicillin, Cetirizine"
                      value={med.name}
                      onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={med.duration_days}
                      onChange={(e) => updateMedication(idx, 'duration_days', Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Frequency (Daily Timing)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1-0-1 (Morning & Night) or 1-1-1"
                      value={med.frequency}
                      onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Food Directions / Precautions</label>
                    <input
                      type="text"
                      placeholder="e.g. After food with plenty of water"
                      value={med.food_instructions}
                      onChange={(e) => updateMedication(idx, 'food_instructions', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                General Dietary & Recovery Advice
              </label>
              <textarea
                rows={2}
                value={generalAdvice}
                onChange={(e) => setGeneralAdvice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Completing this form will mark the appointment as COMPLETED.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/doctor/appointments')}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'Recording Consultation...' : 'Finalize & Issue Prescription'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

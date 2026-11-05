import React, { useEffect, useState } from 'react';
import { Users, FileText, Pill, Calendar, Clock, Stethoscope, ArrowLeft, Eye, ShieldCheck, User } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface DoctorPatientsProps {
  patientId?: string;
  navigate: (path: string) => void;
}

export const DoctorPatientsView: React.FC<DoctorPatientsProps> = ({ patientId, navigate }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientData, setSelectedPatientData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    async function loadPatientsList() {
      try {
        const list = await apiRequest('/api/doctor/patients');
        setPatients(list);
      } catch (err) {
        console.error('Error fetching doctor patients:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatientsList();
  }, []);

  useEffect(() => {
    if (patientId) {
      loadPatientDetails(patientId);
    }
  }, [patientId]);

  const loadPatientDetails = async (id: string) => {
    setLoadingDetail(true);
    try {
      const data = await apiRequest(`/api/doctor/patients/${id}`);
      setSelectedPatientData(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load patient history.');
    } finally {
      setLoadingDetail(false);
    }
  };

  if (patientId && selectedPatientData) {
    const { patient, consultations, prescriptions, records } = selectedPatientData;
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/patients')}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Patient Medical History & Longitudinal Chart
            </h1>
            <p className="text-xs text-slate-500">
              Authorized clinical records for patient under active care
            </p>
          </div>
        </div>

        {/* Patient Demographic Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg">
                {patient.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{patient.full_name}</h3>
                <p className="text-xs text-slate-500">
                  {patient.village_or_town}, {patient.district} • Phone: <strong className="font-mono">{patient.phone}</strong>
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Authorized Care Relationship
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400 block">Language</span>
              <strong className="uppercase">{patient.preferred_language}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Emergency Contact</span>
              <strong className="font-mono">{patient.emergency_contact_phone || 'None'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Consultations Recorded</span>
              <strong>{consultations.length} visits</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Diagnostic Reports</span>
              <strong>{records.length} files</strong>
            </div>
          </div>
        </div>

        {/* Past Clinical Consultations */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            Past Consultations & Clinical Notes
          </h3>

          {consultations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-800">
              No previous clinical consultations recorded for this patient.
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((c: any) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <div>
                      <span className="font-mono font-bold text-teal-600">{c.reference_code}</span>
                      <span className="text-slate-500 ml-2">Visited on {c.appointment_date}</span>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Dr. {c.doctor_name}</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 block mb-0.5">Symptoms Observed:</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{c.symptoms_observed}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 block mb-0.5">Confidential Examination Assessment:</span>
                    <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 leading-relaxed font-mono text-[11px]">
                      {c.clinical_notes}
                    </p>
                  </div>

                  {c.follow_up_instructions && (
                    <div className="text-[11px] text-teal-700 dark:text-teal-300">
                      Follow-up: <strong>{c.follow_up_date || 'None'}</strong> — {c.follow_up_instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Reports & Uploads */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Uploaded Lab Reports & Scans
          </h3>

          {records.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-800">
              No diagnostic records or laboratory scans uploaded by this patient.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {records.map((rec: any) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-3">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{rec.title}</h4>
                    <span className="text-[11px] text-slate-500 block truncate">{rec.file_name}</span>
                    <span className="text-[10px] text-teal-600 font-semibold">{rec.record_type}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/patient/records`)}
                    className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold shrink-0 cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Patients Directory List
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          My Patients Directory
        </h1>
        <p className="text-xs text-slate-500">
          Patients who have active or previous clinical consultation relationships with you
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
          No patients currently assigned. Patients will be listed once appointments are scheduled.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {patients.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.full_name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{p.phone}</p>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div>Village: <strong>{p.village_or_town}</strong>, {p.district}</div>
                  <div>Total Consultations: <strong>{p.total_appointments}</strong></div>
                  <div>Latest Visit: <strong>{p.latest_visit || 'None'}</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => loadPatientDetails(p.id)}
                  className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Full Medical History</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

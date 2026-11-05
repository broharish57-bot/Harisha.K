import React, { useEffect, useState } from 'react';
import { Pill, Printer, Calendar, Clock, Stethoscope, AlertCircle, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useLanguage } from '../../lib/LanguageContext.tsx';

interface PrescriptionsViewProps {
  navigate: (path: string) => void;
}

export const PatientPrescriptionsView: React.FC<PrescriptionsViewProps> = ({ navigate }) => {
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrescriptions() {
      try {
        const data = await apiRequest('/api/patient/prescriptions');
        setPrescriptions(data);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPrescriptions();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            My Medical Prescriptions
          </h1>
          <p className="text-xs text-slate-500">
            Official clinician prescriptions issued by authorized doctors
          </p>
        </div>

        {prescriptions.length > 0 && (
          <button
            onClick={handlePrint}
            className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-teal-600" />
            <span>Print / Save Prescriptions</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
          <Pill className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Prescriptions Issued Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you complete a consultation with a registered doctor, your official medication chart and dietary instructions will appear here.
          </p>
          <button
            onClick={() => navigate('/patient/appointments/new')}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
          >
            Book Consultation
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((pr) => (
            <div
              key={pr.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md space-y-5 print:border-black print:shadow-none"
            >
              {/* Doctor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Dr. {pr.doctor_name}
                    </h3>
                    <p className="text-xs text-slate-500">{pr.department} • {pr.qualification}</p>
                  </div>
                </div>

                <div className="text-xs sm:text-right space-y-0.5">
                  <div className="font-mono text-teal-700 dark:text-teal-400 font-bold">
                    Ref: {pr.reference_code}
                  </div>
                  <div className="text-slate-500">Date: {pr.appointment_date}</div>
                </div>
              </div>

              {/* Medications Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Prescribed Medications (Rx)
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Medicine Name</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {pr.medications?.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-750">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            {m.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">
                            {m.dosage}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-mono font-bold">
                              {m.frequency}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {m.duration_days} days
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {m.food_instructions || 'After meals with water'}
                            {m.warnings && (
                              <span className="block text-[11px] text-amber-600 font-medium">
                                Warning: {m.warnings}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Advice */}
              {pr.general_advice && (
                <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 text-xs">
                  <span className="font-bold text-teal-900 dark:text-teal-200 block mb-1">
                    Doctor's Advice & Precautions:
                  </span>
                  <p className="text-teal-800 dark:text-teal-300 leading-relaxed">
                    {pr.general_advice}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Clinically Verified Electronic Prescription
                </span>
                <span>Dispense as per doctor's directions</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Users, Phone, MapPin, Globe, Shield, Lock, Search } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface PatientsViewProps {
  navigate: (path: string) => void;
}

export const HealthWorkerPatientsView: React.FC<PatientsViewProps> = ({ navigate }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await apiRequest('/api/health-worker/patients');
        setPatients(data);
      } catch (err) {
        console.error('Error fetching health worker patients:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  const filtered = patients.filter((p) =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery) ||
    p.village_or_town?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Village Community Patients Directory
          </h1>
          <p className="text-xs text-slate-500">
            Registered village residents under your health outreach coverage
          </p>
        </div>

        <button
          onClick={() => navigate('/health-worker/patients/new')}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md cursor-pointer"
        >
          + Assisted Enrollment
        </button>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs flex items-center gap-3">
        <Lock className="w-5 h-5 text-teal-600 shrink-0" />
        <div>
          <span className="font-bold">Role-Based Medical Privacy Enforcement:</span> As a Village Health Worker, you have access to patient demographic contacts and appointment assistance tools. In accordance with patient confidentiality laws, confidential doctor consultation diagnosis notes and clinical prescription issuance are strictly restricted to treating doctors.
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by patient name, phone, or village..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading village directory...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
          No patients found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
                  {p.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{p.phone}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>{p.village_or_town}, {p.district}</span>
                </div>
                <div>Language: <strong className="uppercase">{p.preferred_language}</strong></div>
                <div>Emergency Contact: <strong className="font-mono">{p.emergency_contact_phone || 'None'}</strong></div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href={`tel:${p.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Call Resident</span>
                </a>
                <span className="text-[11px] text-slate-400">
                  Enrolled {p.created_at?.split('T')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

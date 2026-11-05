import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, UserPlus, Search, Stethoscope, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface AdminUsersProps {
  navigate: (path: string) => void;
}

export const AdminUsersView: React.FC<AdminUsersProps> = ({ navigate }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Staff Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffRole, setStaffRole] = useState<'doctor' | 'health_worker'>('doctor');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Doctor@2026');
  const [department, setDepartment] = useState('General Medicine');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [workerCode, setWorkerCode] = useState('');
  const [assignedVillage, setAssignedVillage] = useState('Gabbur');
  const [assignedPHC, setAssignedPHC] = useState('Gabbur Primary Health Center');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleDoctorVerification = async (doctorId: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/api/admin/doctors/${doctorId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ is_verified: !currentStatus }),
      });
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update verification.');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/api/admin/users/create-staff', {
        method: 'POST',
        body: JSON.stringify({
          role: staffRole,
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password: password.trim(),
          department,
          license_number: licenseNumber.trim(),
          qualification: qualification.trim(),
          worker_code: workerCode.trim(),
          assigned_village: assignedVillage.trim(),
          assigned_primary_health_center: assignedPHC.trim(),
        }),
      });

      setShowCreateModal(false);
      setFullName('');
      setPhone('');
      setEmail('');
      await loadUsers();
      alert(`Staff account (${staffRole}) created successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.village_or_town?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            User & Healthcare Staff Directory
          </h1>
          <p className="text-xs text-slate-500">
            Verify medical practitioners, provision health workers, and monitor system accounts
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Staff Member</span>
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'doctor', 'health_worker', 'patient', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterRole === r
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {r === 'ALL'
                ? 'All Users'
                : r === 'doctor'
                ? 'Doctors'
                : r === 'health_worker'
                ? 'Health Workers (ASHA)'
                : r === 'patient'
                ? 'Patients'
                : 'Admins'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search name, phone, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Users Table / Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading user accounts...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
          No users match the selected role or query.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4">Village / District</th>
                <th className="py-3 px-4">License / Details</th>
                <th className="py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {u.full_name}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'doctor'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.role === 'health_worker'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {u.phone}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {u.village_or_town}, {u.district}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {u.role === 'doctor' && (
                      <div>
                        <strong>{u.license_number || 'Pending'}</strong>
                        <div className="text-slate-400">{u.department}</div>
                      </div>
                    )}
                    {u.role === 'health_worker' && (
                      <div>
                        <strong>{u.worker_code}</strong>
                        <div className="text-slate-400">Village: {u.assigned_village}</div>
                      </div>
                    )}
                    {u.role === 'patient' && <span className="text-slate-400">Standard Patient</span>}
                    {u.role === 'admin' && <span className="text-purple-600 font-bold">System Superuser</span>}
                  </td>
                  <td className="py-3 px-4">
                    {u.role === 'doctor' ? (
                      <button
                        onClick={() => handleToggleDoctorVerification(u.id, Boolean(u.doctor_verified))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          u.doctor_verified
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                      >
                        {u.doctor_verified ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Verify License</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-emerald-600 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provision Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Provision Healthcare Staff Account
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Role *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStaffRole('doctor')}
                    className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                      staffRole === 'doctor'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Medical Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffRole('health_worker')}
                    className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                      staffRole === 'health_worker'
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Village Health Worker (ASHA)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={staffRole === 'doctor' ? 'Dr. Ramesh Patil' : 'Smt. Shanta Devi'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {staffRole === 'doctor' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Department
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="General Medicine">General Medicine</option>
                        <option value="Pediatrics">Pediatrics & Child Care</option>
                        <option value="Obstetrics & Gynecology">Maternal Care</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Ophthalmology">Eye Care</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Medical License Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. KMC-10492"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ASHA Worker Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ASHA-RAI-042"
                        value={workerCode}
                        onChange={(e) => setWorkerCode(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Assigned Village Cluster
                      </label>
                      <input
                        type="text"
                        value={assignedVillage}
                        onChange={(e) => setAssignedVillage(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Creating Account...' : 'Create Staff Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { FileText, Upload, Plus, Eye, Download, X, AlertCircle, CheckCircle, FileCheck, Image as ImageIcon } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useLanguage } from '../../lib/LanguageContext.tsx';

interface RecordsViewProps {
  navigate: (path: string) => void;
}

export const PatientRecordsView: React.FC<RecordsViewProps> = ({ navigate }) => {
  const { t } = useLanguage();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('LAB_REPORT');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // View modal state
  const [previewRecord, setPreviewRecord] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/patient/records');
      setRecords(data);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = e.target.files[0];
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid format. Please upload a PDF file or JPG/PNG image scan.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15 MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title.trim()) {
      setUploadError('Please select a file and provide a report title.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Read file as Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      await apiRequest('/api/patient/records', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          record_type: recordType,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_data_base64: base64Data,
          notes: notes.trim(),
        }),
      });

      setUploadSuccess('Diagnostic report uploaded securely.');
      setTimeout(() => setUploadSuccess(null), 4000);
      setShowUploadModal(false);
      setTitle('');
      setSelectedFile(null);
      setNotes('');
      await loadRecords();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async (id: string) => {
    setLoadingPreview(true);
    try {
      const data = await apiRequest(`/api/patient/records/${id}`);
      setPreviewRecord(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load record details.');
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Medical Records & Lab Reports
          </h1>
          <p className="text-xs text-slate-500">
            Encrypted private health records and diagnostic laboratory scans
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Medical Document</span>
        </button>
      </div>

      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading documents...</div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Documents Uploaded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload blood work reports, X-rays, ECGs, or hospital discharge papers to make them securely accessible to your treating doctors.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
          >
            Upload First Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {rec.record_type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(rec.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {rec.title}
                </h3>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  {rec.file_name}
                </p>

                {rec.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">
                    "{rec.notes}"
                  </p>
                )}

                <div className="text-[11px] text-slate-400 pt-1">
                  Uploaded on {rec.created_at?.split('T')[0]}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <button
                  onClick={() => openPreview(rec.id)}
                  className="font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Document
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-600" />
                Upload Diagnostic Report
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) or Chest X-Ray"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Type *
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="LAB_REPORT">Laboratory / Blood Test Report</option>
                  <option value="IMAGING">X-Ray / Ultrasound / CT Scan Image</option>
                  <option value="DISCHARGE_SUMMARY">Hospital Discharge Summary</option>
                  <option value="VACCINATION">Immunization / Vaccination Card</option>
                  <option value="OTHER">Other Clinical Document</option>
                </select>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Choose File (PDF or JPG/PNG image, max 15MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-950 dark:file:text-teal-300 cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-1 text-[11px] text-teal-600 font-medium">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Notes / Context
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Test performed at Raichur District Hospital laboratory"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'Encrypting & Uploading...' : 'Upload Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document View / Preview Modal */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {previewRecord.title}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {previewRecord.file_name} • {(previewRecord.file_size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                onClick={() => setPreviewRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-center">
              {previewRecord.file_type.startsWith('image/') ? (
                <img
                  src={previewRecord.file_data_base64}
                  alt={previewRecord.title}
                  className="max-h-[55vh] mx-auto rounded-lg object-contain shadow-xs"
                />
              ) : previewRecord.file_type === 'application/pdf' ? (
                <iframe
                  src={previewRecord.file_data_base64}
                  title={previewRecord.title}
                  className="w-full h-[55vh] rounded-lg"
                />
              ) : (
                <div className="p-8 text-xs text-slate-500">
                  Preview not directly rendered for this format. You can download the file below.
                </div>
              )}
            </div>

            {previewRecord.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                "{previewRecord.notes}"
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <a
                href={previewRecord.file_data_base64}
                download={previewRecord.file_name}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Save to Device</span>
              </a>
              <button
                onClick={() => setPreviewRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-xs"
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

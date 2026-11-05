import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  X,
  Server,
  CloudUpload,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'configure' | 'sync' | 'sql' | 'guide'>('configure');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // Form State
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceKey, setServiceKey] = useState('');

  // Status & Feedback
  const [status, setStatus] = useState<{
    isConfigured: boolean;
    url: string;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
    anonKeyPreview: string;
    serviceKeyPreview: string;
  } | null>(null);

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    tablesVerified?: string[];
  } | null>(null);

  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    syncedCounts?: Record<string, number>;
  } | null>(null);

  const [sqlContent, setSqlContent] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch status on open
  useEffect(() => {
    if (isOpen) {
      loadStatus();
      loadSql();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const token = localStorage.getItem('ruralcare_token');
      const res = await fetch('/api/supabase/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.url && !url) {
          setUrl(data.url);
        }
      }
    } catch (err) {
      console.error('Error fetching Supabase status:', err);
    }
  };

  const loadSql = async () => {
    try {
      const token = localStorage.getItem('ruralcare_token');
      const res = await fetch('/api/supabase/sql-migration', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSqlContent(data.sql);
      }
    } catch (err) {
      console.error('Error fetching SQL migration:', err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      setErrorMsg('Please enter both your Supabase Project URL and Anon Public Key.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('ruralcare_token');
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, anonKey, serviceKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSaveSuccess(true);
      await loadStatus();
      // Auto run test
      handleTestConnection();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving Supabase settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const token = localStorage.getItem('ruralcare_token');
      const res = await fetch('/api/supabase/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, anonKey, serviceKey }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while attempting to connect to Supabase.',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSyncData = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const token = localStorage.getItem('ruralcare_token');
      const res = await fetch('/api/supabase/sync-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }
      setSyncResult(data);
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Error occurred during data synchronization.',
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Supabase Database Connect
                </h3>
                {status?.isConfigured ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Local Storage Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Simple cloud connection for RuralCare Connect patient database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('configure')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'configure'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-700 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            1. Connect Credentials
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-700 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <span>2. SQL Schema Migration</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-mono">1-Click</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-700 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <span>3. Cloud Sync</span>
            <CloudUpload className="w-3.5 h-3.5 text-teal-600" />
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'guide'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-700 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            Quick Guide
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: CONFIGURE */}
          {activeTab === 'configure' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-3">
                <Server className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Seamless Dual-Database Architecture</p>
                  <p className="text-teal-800 dark:text-teal-300 mt-0.5">
                    RuralCare Connect uses local synchronous SQLite for offline resilient operations in rural clinics, and automatically links to Supabase PostgreSQL for cloud sync, doctor access, and multi-facility coordination.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Configuration saved and validated!</span>
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Supabase Project URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://your-project-id.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    Found in your Supabase Dashboard under <strong>Project Settings → API</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Supabase Anon Public Key (client) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                  {status?.hasAnonKey && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 block">
                      ✓ Configured ({status.anonKeyPreview})
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Supabase Service Role Secret Key (Optional - for auto-sync)
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={serviceKey}
                    onChange={(e) => setServiceKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    Allows backend server to bypass RLS during batch sync from local clinic nodes.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save & Connect</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testLoading}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    {testLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-teal-600" />
                    )}
                    <span>Test Latency & Connection</span>
                  </button>
                </div>
              </form>

              {/* Test Result Display */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    testResult.success
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      {testResult.success ? 'Supabase Connection Active' : 'Connection Failed'}
                    </span>
                    {testResult.latencyMs !== undefined && (
                      <span className="font-mono text-[11px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-300">
                        {testResult.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="mt-1">{testResult.message}</p>

                  {testResult.tablesVerified && testResult.tablesVerified.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-emerald-200/60 flex flex-wrap gap-1.5 items-center">
                      <span className="font-semibold text-[11px]">Tables Verified:</span>
                      {testResult.tablesVerified.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 font-mono text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SQL SCHEMA MIGRATION */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    PostgreSQL Core Schema (Tables, RLS & Constraints)
                  </h4>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    Paste this into the Supabase Dashboard SQL Editor to bootstrap your cloud database in 10 seconds.
                  </p>
                </div>
                <button
                  onClick={copySqlToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied SQL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Migration SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] h-64 overflow-y-auto border border-slate-800 leading-relaxed">
                  {sqlContent || '-- Loading schema...'}
                </pre>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Includes 15 tables with Row Level Security (RLS) rules for patient confidentiality.</span>
                </div>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Open Supabase SQL Editor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: CLOUD SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CloudUpload className="w-4 h-4 text-teal-600" />
                  <span>Sync Local Database to Supabase Cloud</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  Upload all locally created patients, doctor consultations, walk-in appointments, and issued prescriptions to your Supabase PostgreSQL cloud instance.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSyncData}
                    disabled={syncLoading}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {syncLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5" />
                    )}
                    <span>Run Full Sync Now</span>
                  </button>
                </div>
              </div>

              {syncResult && (
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    syncResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-900 dark:text-red-200'
                  }`}
                >
                  <p className="font-bold flex items-center gap-2">
                    {syncResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{syncResult.message}</span>
                  </p>

                  {syncResult.syncedCounts && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      {Object.entries(syncResult.syncedCounts).map(([table, count]) => (
                        <div key={table} className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800">
                          <div className="text-[10px] uppercase text-slate-700 font-bold">{table}</div>
                          <div className="text-base font-extrabold text-teal-700 dark:text-teal-300">{count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUICK GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Create a Free Supabase Project</span>
                </div>
                <p className="pl-7 text-slate-600 dark:text-slate-400">
                  Visit <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-teal-600 font-bold underline">supabase.com</a>, log in with GitHub/Google, and create a project named <strong>ruralcare-connect</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Run the Migration Schema</span>
                </div>
                <p className="pl-7 text-slate-600 dark:text-slate-400">
                  Click the <strong>"2. SQL Schema Migration"</strong> tab above, click <strong>"Copy Migration SQL"</strong>, and paste it into the Supabase Dashboard <strong>SQL Editor</strong>, then click <strong>Run</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Enter Your URL and Key</span>
                </div>
                <p className="pl-7 text-slate-600 dark:text-slate-400">
                  Copy your Project URL and anon public key from <strong>Project Settings → API</strong> into Tab 1, and click <strong>Save & Connect</strong>. Your RuralCare Connect platform will now be fully cloud synced!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">
            Local SQLite database remains 100% active for offline village care.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

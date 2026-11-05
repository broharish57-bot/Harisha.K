import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { getPendingOfflineActions } from '../lib/offlineQueue.ts';
import { syncOfflineQueue } from '../lib/api.ts';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const checkPending = async () => {
    try {
      const items = await getPendingOfflineActions();
      setPendingCount(items.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync on reconnection
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(checkPending, 8000);
    checkPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncOfflineQueue();
      if (res.total > 0) {
        setSyncMessage(`Synced ${res.synced} of ${res.total} offline request(s).`);
        setTimeout(() => setSyncMessage(null), 5000);
      }
      await checkPending();
    } catch (err: any) {
      setSyncMessage(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0 && !syncMessage) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl bg-slate-900/95 text-white px-4 py-2.5 shadow-2xl border border-slate-700 backdrop-blur-md text-xs">
      {!isOnline ? (
        <>
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-300">Offline Mode</span>
          </div>
          <span className="text-slate-300">
            {pendingCount > 0
              ? `${pendingCount} request(s) queued in local storage.`
              : 'Requests will be securely queued.'}
          </span>
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-200">
            {syncMessage || (pendingCount > 0 ? `${pendingCount} offline item(s) pending sync` : 'Connected')}
          </span>
          {pendingCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 font-medium text-white transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          )}
        </>
      )}
    </div>
  );
};

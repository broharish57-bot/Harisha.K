import React, { useEffect, useState } from 'react';
import { MessageSquare, PhoneCall, ShieldAlert, CheckCircle, AlertTriangle, RefreshCw, Radio } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface CommsViewProps {
  navigate: (path: string) => void;
}

export const AdminCommunicationsView: React.FC<CommsViewProps> = ({ navigate }) => {
  const [data, setData] = useState<{
    smsStatus: { live: boolean; provider: string; reason: string };
    telephonyStatus: { live: boolean; provider: string; reason: string };
    recentSmsEvents: any[];
    recentMissedCalls: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadComms = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/communications');
      setData(res);
    } catch (err) {
      console.error('Error loading communications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComms();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            SMS & Telephony Gateway Telemetry
          </h1>
          <p className="text-xs text-slate-500">
            Real provider status, inbound webhook event logs, and Indian DLT compliance monitoring
          </p>
        </div>

        <button
          onClick={loadComms}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Gateway Status Cards (Rule 5 & 6 Compliant) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SMS Status */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  SMS Gateway ({data?.smsStatus.provider})
                </h3>
                <span className="text-[11px] text-slate-400">Inbound Parser & Keypad State Machine</span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                data?.smsStatus.live
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {data?.smsStatus.live ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live Gateway Active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Awaiting Provider Credentials</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {data?.smsStatus.reason}
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1">
            <div className="text-slate-500 font-bold uppercase">Required Environment Variables:</div>
            <div>• SMS_API_KEY: Outbound provider token</div>
            <div>• SMS_SENDER_ID: 6-char TRAI approved header (e.g. RURLCR)</div>
            <div>• SMS_WEBHOOK_SECRET: Inbound webhook verification</div>
          </div>
        </div>

        {/* Telephony Missed-Call Status */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Telephony Gateway ({data?.telephonyStatus.provider})
                </h3>
                <span className="text-[11px] text-slate-400">Inbound Call Webhook & Deduplication</span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                data?.telephonyStatus.live
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {data?.telephonyStatus.live ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Webhook Verified</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Awaiting Webhook Secret</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {data?.telephonyStatus.reason}
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1">
            <div className="text-slate-500 font-bold uppercase">Required Environment Variables:</div>
            <div>• TELEPHONY_WEBHOOK_SECRET: HMAC signature validation</div>
            <div>• Provider Inbound Webhook URL: <code>/api/telephony/missed-call</code></div>
          </div>
        </div>
      </div>

      {/* Real Inbound / Outbound SMS Event Log */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-teal-600" />
          SMS Inbound / Outbound Real Event Log
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold font-sans">
              <tr>
                <th className="py-2.5 px-4">Direction</th>
                <th className="py-2.5 px-4">Phone</th>
                <th className="py-2.5 px-4">Content</th>
                <th className="py-2.5 px-4">Provider Status</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {!data?.recentSmsEvents || data.recentSmsEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                    No SMS events recorded yet. You can test inbound messages on the home page console.
                  </td>
                </tr>
              ) : (
                data.recentSmsEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750">
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.direction === 'INBOUND'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {e.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold">{e.phone}</td>
                    <td className="py-2.5 px-4 max-w-xs truncate">{e.content}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-emerald-600 font-semibold">{e.provider_status}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                      {e.created_at?.replace('T', ' ').slice(0, 19)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

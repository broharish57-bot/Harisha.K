import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, User, Stethoscope, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext.tsx';
import { apiRequest } from '../../lib/api.ts';

interface MessagesViewProps {
  navigate: (path: string) => void;
}

export const PatientMessagesView: React.FC<MessagesViewProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const msgs = await apiRequest('/api/patient/messages');
      setMessages(msgs);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    apiRequest('/api/system/doctors')
      .then((docs) => {
        setDoctors(docs);
        if (docs.length > 0) setSelectedRecipientId(docs[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedRecipientId) return;

    setSending(true);
    try {
      await apiRequest('/api/patient/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: selectedRecipientId,
          content: content.trim(),
        }),
      });
      setContent('');
      await loadMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter(
    (m) =>
      (m.sender_id === user?.id && m.recipient_id === selectedRecipientId) ||
      (m.sender_id === selectedRecipientId && m.recipient_id === user?.id)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Secure Doctor Communication
        </h1>
        <p className="text-xs text-slate-500">
          Authenticated private messages between patients and clinicians
        </p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex flex-col h-[650px] overflow-hidden">
        {/* Recipient Selection Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Message Doctor:
            </label>
          </div>

          <select
            value={selectedRecipientId}
            onChange={(e) => setSelectedRecipientId(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white max-w-sm"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.full_name} ({d.department})
              </option>
            ))}
          </select>
        </div>

        {/* Conversation Message Feed */}
        <div className="grow overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {loading ? (
            <div className="text-center text-xs text-slate-400 py-10">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No messages in this thread yet.</p>
              <p className="text-[11px] text-slate-400">
                You can ask questions regarding your treatment plan or clinic visit.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-0.5 px-1 font-semibold">
                    {isMine ? 'You' : msg.sender_name}
                  </div>
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-teal-600 text-white rounded-br-none shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1 font-mono">
                    {msg.created_at?.split('T')[1]?.slice(0, 5) || ''}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-2">
          <input
            type="text"
            required
            placeholder="Type your message to the doctor..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="grow px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

import crypto from 'node:crypto';
import { db, logAudit } from './db.ts';

export interface TelephonyCallEvent {
  callId: string;
  fromPhone: string;
  toPhone?: string;
  timestamp: string;
  callDurationSeconds?: number;
  callType?: 'MISSED' | 'INBOUND' | 'COMPLETED';
}

// Telephony Provider Status Check
export function isTelephonyProviderLive(): { live: boolean; provider: string; reason: string } {
  const provider = process.env.TELEPHONY_PROVIDER || 'EXOTEL_KALEYRA_OZONETEL';
  const secret = process.env.TELEPHONY_WEBHOOK_SECRET;
  if (!secret) {
    return {
      live: false,
      provider,
      reason: 'Missing TELEPHONY_WEBHOOK_SECRET in environment. Inbound signature validation endpoint active; awaits provider webhook configuration.'
    };
  }
  return {
    live: true,
    provider,
    reason: 'Cryptographic signature verification configured.'
  };
}

// Validate HMAC signature from India telephony provider
export function verifyTelephonySignature(
  payloadString: string,
  providedSignature: string | undefined,
  secret: string
): boolean {
  if (!providedSignature) return false;
  try {
    const computed = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(providedSignature));
  } catch {
    return false;
  }
}

// Process Inbound Missed Call
export function processMissedCallEvent(event: TelephonyCallEvent): {
  success: boolean;
  callbackId?: string;
  isDuplicate: boolean;
  message: string;
} {
  const { callId, fromPhone } = event;

  // Deduplication check using unique provider event ID
  const existing = db.prepare('SELECT id, status FROM callback_requests WHERE provider_call_id = ?').get(callId) as { id: string; status: string } | undefined;
  if (existing) {
    return {
      success: true,
      callbackId: existing.id,
      isDuplicate: true,
      message: 'Event already recorded and deduplicated.'
    };
  }

  // Check if phone matches an existing registered patient
  const registeredPatient = db.prepare('SELECT id, full_name, village_or_town FROM profiles WHERE phone = ?').get(fromPhone) as {
    id: string;
    full_name: string;
    village_or_town: string;
  } | undefined;

  // Check if an active health worker covers that village or is available
  let assignedWorkerId: string | null = null;
  if (registeredPatient) {
    const worker = db.prepare(`
      SELECT hw.id
      FROM health_workers hw
      WHERE hw.assigned_village = ? AND hw.is_verified_by_admin = 1
      LIMIT 1
    `).get(registeredPatient.village_or_town) as { id: string } | undefined;

    if (worker) {
      assignedWorkerId = worker.id;
    }
  }

  // Fallback to any active verified health worker if unassigned
  if (!assignedWorkerId) {
    const fallbackWorker = db.prepare('SELECT id FROM health_workers WHERE is_verified_by_admin = 1 LIMIT 1').get() as { id: string } | undefined;
    if (fallbackWorker) {
      assignedWorkerId = fallbackWorker.id;
    }
  }

  const callbackId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO callback_requests (
      id, caller_phone, caller_name, patient_id, assigned_health_worker_id,
      source, status, attempt_count, provider_call_id, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, 'MISSED_CALL', 'PENDING', 0, ?, ?, ?)
  `).run(
    callbackId,
    fromPhone,
    registeredPatient?.full_name || 'Unregistered Caller',
    registeredPatient?.id || null,
    assignedWorkerId,
    callId,
    now,
    now
  );

  logAudit(
    registeredPatient?.id || null,
    'telephony',
    'RECORD_MISSED_CALL_CALLBACK',
    'callback_requests',
    callbackId,
    { fromPhone, providerCallId: callId, assignedWorkerId }
  );

  return {
    success: true,
    callbackId,
    isDuplicate: false,
    message: 'Callback request registered successfully.'
  };
}

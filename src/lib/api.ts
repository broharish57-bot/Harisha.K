import { queueOfflineAction, getPendingOfflineActions, updateOfflineAction } from './offlineQueue.ts';

const TOKEN_KEY = 'ruralcare_auth_token';
const USER_KEY = 'ruralcare_user_session';
const LANG_KEY = 'ruralcare_preferred_lang';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredSession(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (user.preferred_language) {
    localStorage.setItem(LANG_KEY, user.preferred_language);
  }
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredLanguage(): 'kn' | 'hi' | 'en' {
  if (typeof window === 'undefined') return 'en';
  const l = localStorage.getItem(LANG_KEY);
  if (l === 'kn' || l === 'hi' || l === 'en') return l;
  return 'en';
}

export function setStoredLanguage(lang: 'kn' | 'hi' | 'en') {
  localStorage.setItem(LANG_KEY, lang);
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Universal fetch wrapper with authorization header
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Check if browser is offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    // If it's a POST to appointments or callbacks, queue in IndexedDB
    if (endpoint === '/api/patient/appointments' && options.method === 'POST') {
      const payload = JSON.parse(options.body as string);
      const queued = await queueOfflineAction('CREATE_APPOINTMENT', payload);
      return {
        offline: true,
        queued: true,
        requestId: queued.id,
        reference_code: `PENDING-OFFLINE-${queued.id.slice(-6)}`,
        message: 'Network offline. Appointment request saved locally and will sync when reconnected.',
      } as unknown as T;
    }
    throw new Error('You are currently offline. Please reconnect to submit requests.');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {
      // not JSON
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

// Synchronize queued offline requests
export async function syncOfflineQueue(): Promise<{ total: number; synced: number; failed: number }> {
  const pending = await getPendingOfflineActions();
  if (pending.length === 0) return { total: 0, synced: 0, failed: 0 };

  const token = getStoredToken();
  if (!token) return { total: pending.length, synced: 0, failed: pending.length };

  let synced = 0;
  let failed = 0;

  try {
    const batchPayload = pending.map((p) => ({
      requestId: p.id,
      action: p.action,
      payload: p.payload,
    }));

    const response = await fetch('/api/sync/offline-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: batchPayload }),
    });

    if (response.ok) {
      const data = await response.json();
      for (const res of data.results) {
        if (res.status === 'Synced') {
          await updateOfflineAction(res.requestId, { status: 'Synced', reference: res.reference });
          synced++;
        } else {
          await updateOfflineAction(res.requestId, { status: 'Failed', error: res.error });
          failed++;
        }
      }
    }
  } catch (err) {
    console.error('Offline batch sync error:', err);
  }

  return { total: pending.length, synced, failed };
}

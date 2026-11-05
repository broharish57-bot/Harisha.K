// IndexedDB offline queue for non-sensitive actions (e.g. Appointment booking requests, callback requests)

export interface OfflineAction {
  id: string; // unique client requestId
  action: 'CREATE_APPOINTMENT' | 'CREATE_CALLBACK';
  payload: any;
  timestamp: string;
  status: 'Pending' | 'Synced' | 'Failed';
  retryCount: number;
  error?: string;
  reference?: string;
}

const DB_NAME = 'RuralCareOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_queue';

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Queue an action offline
export async function queueOfflineAction(action: 'CREATE_APPOINTMENT' | 'CREATE_CALLBACK', payload: any): Promise<OfflineAction> {
  const db = await openOfflineDB();
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item: OfflineAction = {
    id: requestId,
    action,
    payload,
    timestamp: new Date().toISOString(),
    status: 'Pending',
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

// Retrieve pending queue
export async function getPendingOfflineActions(): Promise<OfflineAction[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result as OfflineAction[];
        resolve(items.filter((i) => i.status === 'Pending' || i.status === 'Failed'));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// Update action status after sync attempt
export async function updateOfflineAction(id: string, updates: Partial<OfflineAction>): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          const updated = { ...item, ...updates };
          store.put(updated);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.error('Error updating offline queue item:', err);
  }
}

// Clear all offline stored actions on logout
export async function clearOfflineStorageOnLogout(): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

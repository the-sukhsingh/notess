import { openDB } from 'idb';

const DB_NAME = 'notessDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';
const SYNC_STORE = 'sync-queue';

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Notes store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('modifiedAt', 'modifiedAt');
      }
      // Sync queue store
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        const syncStore = db.createObjectStore(SYNC_STORE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

export async function getAllNotes() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function saveNote(note) {
  const db = await initDB();
  note.modifiedAt = new Date().toISOString();
  await db.put(STORE_NAME, note);
  
  // Add to sync queue if offline
  if (!navigator.onLine) {
    await addToSyncQueue({
      type: 'save',
      data: note,
      timestamp: new Date().toISOString()
    });
    await registerSync();
  }
}

export async function deleteNote(id) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
  
  // Add to sync queue if offline
  if (!navigator.onLine) {
    await addToSyncQueue({
      type: 'delete',
      data: { id },
      timestamp: new Date().toISOString()
    });
    await registerSync();
  }
}

export async function bulkSaveNotes(notes) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all([
    ...notes.map(note => tx.store.put(note)),
    tx.done
  ]);
}

// Add operation to sync queue
async function addToSyncQueue(operation) {
  const db = await initDB();
  await db.add(SYNC_STORE, operation);
}

// Process sync queue
export async function processSyncQueue() {
  const db = await initDB();
  const queue = await db.getAll(SYNC_STORE);
  
  for (const operation of queue) {
    try {
      if (operation.type === 'save') {
        // Implement your API call here
        await fetch('/api/notes', {
          method: 'POST',
          body: JSON.stringify(operation.data),
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (operation.type === 'delete') {
        await fetch(`/api/notes/${operation.data.id}`, {
          method: 'DELETE',
        });
      }
      // Remove from queue after successful sync
      await db.delete(SYNC_STORE, operation.id);
    } catch (error) {
      console.error('Sync failed for operation:', operation, error);
      // Keep in queue to retry later
    }
  }
}

// Function to handle background sync
export async function registerSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.sync.register('sync-notes');
    } catch (err) {
      console.error('Background sync registration failed:', err);
    }
  }
}
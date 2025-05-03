import { openDB } from 'idb';

const DB_NAME = 'notessDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('modifiedAt', 'modifiedAt');
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
}

export async function deleteNote(id) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function bulkSaveNotes(notes) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all([
    ...notes.map(note => tx.store.put(note)),
    tx.done
  ]);
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
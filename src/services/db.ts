import { AudioItem, BellEvent, BellLog, DayOfWeek, MorningActivity, SystemSettings } from '../types';
import { DEFAULT_MORNING_ACTIVITIES, DEFAULT_SCHEDULES, DEFAULT_SETTINGS } from './defaultData';

const DB_NAME = 'PAGS_School_Bell_DB';
const DB_VERSION = 1;

const STORES = {
  AUDIOS: 'audios',
  SCHEDULES: 'schedules',
  MORNING_ACTIVITIES: 'morning_activities',
  SETTINGS: 'settings',
  LOGS: 'logs',
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.AUDIOS)) {
        db.createObjectStore(STORES.AUDIOS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.SCHEDULES)) {
        db.createObjectStore(STORES.SCHEDULES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.MORNING_ACTIVITIES)) {
        db.createObjectStore(STORES.MORNING_ACTIVITIES, { keyPath: 'day' });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.LOGS)) {
        const logStore = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ----------------- AUDIO OPERATIONS -----------------

export async function saveAudioToDB(audio: AudioItem): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.AUDIOS, 'readwrite');
    const store = transaction.objectStore(STORES.AUDIOS);
    const request = store.put(audio);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllAudiosFromDB(): Promise<AudioItem[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.AUDIOS, 'readonly');
    const store = transaction.objectStore(STORES.AUDIOS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getAudioByIdFromDB(id: string): Promise<AudioItem | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.AUDIOS, 'readonly');
    const store = transaction.objectStore(STORES.AUDIOS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAudioFromDB(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.AUDIOS, 'readwrite');
    const store = transaction.objectStore(STORES.AUDIOS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function renameAudioInDB(id: string, newName: string): Promise<void> {
  const audio = await getAudioByIdFromDB(id);
  if (audio) {
    audio.name = newName;
    await saveAudioToDB(audio);
  }
}

// ----------------- SCHEDULE OPERATIONS -----------------

export async function saveSchedulesToDB(schedules: BellEvent[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SCHEDULES, 'readwrite');
    const store = transaction.objectStore(STORES.SCHEDULES);
    store.clear(); // clear old schedules and put all current

    for (const schedule of schedules) {
      store.put(schedule);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getSchedulesFromDB(): Promise<BellEvent[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SCHEDULES, 'readonly');
    const store = transaction.objectStore(STORES.SCHEDULES);
    const request = store.getAll();

    request.onsuccess = () => {
      const result = request.result;
      if (!result || result.length === 0) {
        // initialize default schedules on first visit
        saveSchedulesToDB(DEFAULT_SCHEDULES).then(() => {
          resolve(DEFAULT_SCHEDULES);
        });
      } else {
        // sort by time
        const sorted = result.sort((a, b) => a.time.localeCompare(b.time));
        resolve(sorted);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ----------------- MORNING ACTIVITIES OPERATIONS -----------------

export async function saveMorningActivitiesToDB(activities: Record<DayOfWeek, MorningActivity>): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MORNING_ACTIVITIES, 'readwrite');
    const store = transaction.objectStore(STORES.MORNING_ACTIVITIES);

    for (const day of Object.keys(activities) as DayOfWeek[]) {
      store.put(activities[day]);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getMorningActivitiesFromDB(): Promise<Record<DayOfWeek, MorningActivity>> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MORNING_ACTIVITIES, 'readonly');
    const store = transaction.objectStore(STORES.MORNING_ACTIVITIES);
    const request = store.getAll();

    request.onsuccess = () => {
      const result: MorningActivity[] = request.result;
      if (!result || result.length === 0) {
        saveMorningActivitiesToDB(DEFAULT_MORNING_ACTIVITIES).then(() => {
          resolve(DEFAULT_MORNING_ACTIVITIES);
        });
      } else {
        const map: Record<DayOfWeek, MorningActivity> = { ...DEFAULT_MORNING_ACTIVITIES };
        for (const act of result) {
          map[act.day] = act;
        }
        resolve(map);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ----------------- SYSTEM SETTINGS -----------------

export async function saveSettingsToDB(settings: SystemSettings): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.put({ key: 'main_settings', value: settings });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSettingsFromDB(): Promise<SystemSettings> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.get('main_settings');

    request.onsuccess = () => {
      if (request.result && request.result.value) {
        const storedSettings = request.result.value as Partial<SystemSettings>;
        resolve({
          ...DEFAULT_SETTINGS,
          ...storedSettings,
          scheduleRevision: storedSettings.scheduleRevision ?? 1,
        });
      } else {
        saveSettingsToDB(DEFAULT_SETTINGS).then(() => {
          resolve(DEFAULT_SETTINGS);
        });
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ----------------- BELL LOGS -----------------

export async function saveLogToDB(log: BellLog): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.LOGS, 'readwrite');
    const store = transaction.objectStore(STORES.LOGS);
    const request = store.put(log);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllLogsFromDB(): Promise<BellLog[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.LOGS, 'readonly');
    const store = transaction.objectStore(STORES.LOGS);
    const request = store.getAll();

    request.onsuccess = () => {
      const logs: BellLog[] = request.result || [];
      // Sort newest first
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(logs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllLogsFromDB(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.LOGS, 'readwrite');
    const store = transaction.objectStore(STORES.LOGS);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

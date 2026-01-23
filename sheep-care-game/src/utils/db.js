const DB_NAME = 'sheep_care_game_db';
const DB_VERSION = 1;
const STORE_NAME = 'game_data';

export const dbData = {
    db: null,
};

export const initDB = () => {
    return new Promise((resolve, reject) => {
        if (dbData.db) {
            resolve(dbData.db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB Error:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            dbData.db = event.target.result;
            resolve(dbData.db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME); // Key is userId, manual layout
            }
        };
    });
};

export const getData = async (key) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (e) {
        console.error("DB Get Error", e);
        return null;
    }
};

export const saveData = async (key, data) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(data, key);

            request.onsuccess = () => {
                resolve(true);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (e) {
        console.error("DB Save Error", e);
        return false;
    }
};

export const clearData = async (key) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (e) { return false; }
};

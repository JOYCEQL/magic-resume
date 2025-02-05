// 存储文件句柄和配置信息
const DB_NAME = "FileHandleDB";
const HANDLE_STORE = "handles";
const CONFIG_STORE = "config";
const DB_VERSION = 2;

let db: IDBDatabase | null = null;

const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve();
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE);
      }
    };
  });
};

export const storeFileHandle = async (
  key: string,
  handle: FileSystemHandle
): Promise<void> => {
  await initDB();
  if (!db) throw new Error("Database not initialized");

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HANDLE_STORE, "readwrite");
    const store = transaction.objectStore(HANDLE_STORE);
    const request = store.put(handle, key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getFileHandle = async (
  key: string
): Promise<FileSystemHandle | null> => {
  await initDB();
  if (!db) throw new Error("Database not initialized");

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HANDLE_STORE, "readonly");
    const store = transaction.objectStore(HANDLE_STORE);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const storeConfig = async (key: string, value: any): Promise<void> => {
  await initDB();
  if (!db) throw new Error("Database not initialized");

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONFIG_STORE, "readwrite");
    const store = transaction.objectStore(CONFIG_STORE);
    const request = store.put(value, key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getConfig = async (key: string): Promise<any> => {
  await initDB();
  if (!db) throw new Error("Database not initialized");

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONFIG_STORE, "readonly");
    const store = transaction.objectStore(CONFIG_STORE);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const verifyPermission = async (
  handle: FileSystemHandle,
  mode: FileSystemPermissionMode = "readwrite"
): Promise<boolean> => {
  if (!handle) {
    return false;
  }

  const options = { mode };

  // 检查当前权限
  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }

  // 请求权限
  if ((await handle.requestPermission(options)) === "granted") {
    return true;
  }

  return false;
};

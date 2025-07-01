// IndexedDB Web Worker
// 处理IndexedDB大数据量操作，防止主线程阻塞

interface IndexedDBWorkerMessage {
  id: string;
  type: 'getDatabases' | 'getObjectStores' | 'getStoreData' | 'deleteDatabase';
  payload?: any;
}

interface IndexedDBWorkerResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

interface DatabaseInfo {
  name: string;
  version: number;
  objectStores: ObjectStoreInfo[];
  size: number;
}

interface ObjectStoreInfo {
  name: string;
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  indexes: IndexInfo[];
  recordCount: number;
}

interface IndexInfo {
  name: string;
  keyPath: string | string[];
  unique: boolean;
  multiEntry: boolean;
}

class IndexedDBWorker {
  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  private async handleMessage(event: MessageEvent<IndexedDBWorkerMessage>) {
    const { id, type, payload } = event.data;

    try {
      let result: any;

      switch (type) {
        case 'getDatabases':
          result = await this.getDatabases();
          break;
        case 'getObjectStores':
          result = await this.getObjectStores(payload.dbName);
          break;
        case 'getStoreData':
          result = await this.getStoreData(payload.dbName, payload.storeName, payload.limit);
          break;
        case 'deleteDatabase':
          result = await this.deleteDatabase(payload.dbName);
          break;
        default:
          throw new Error(`Unknown message type: ${type}`);
      }

      this.sendResponse(id, true, result);
    } catch (error) {
      console.error('IndexedDB Worker error:', error);
      this.sendResponse(id, false, null, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private sendResponse(id: string, success: boolean, data?: any, error?: string) {
    const response: IndexedDBWorkerResponse = { id, success, data, error };
    self.postMessage(response);
  }

  private async getDatabases(): Promise<DatabaseInfo[]> {
    if (!('indexedDB' in self)) {
      throw new Error('IndexedDB is not supported');
    }

    // 获取所有数据库（这个API可能不被所有浏览器支持）
    let databases: IDBDatabaseInfo[] = [];

    try {
      if ('databases' in indexedDB) {
        databases = await (indexedDB as any).databases();
      }
    } catch (error) {
      console.warn('indexedDB.databases() not supported, using fallback method');
      // 如果不支持，返回空数组或使用其他方法
      return [];
    }

    const databaseInfos: DatabaseInfo[] = [];

    for (const dbInfo of databases) {
      try {
        const db = await this.openDatabase(dbInfo.name!, dbInfo.version);
        const info = await this.getDatabaseInfo(db);
        databaseInfos.push(info);
        db.close();
      } catch (error) {
        console.error(`Failed to get info for database ${dbInfo.name}:`, error);
      }
    }

    return databaseInfos;
  }

  private async openDatabase(name: string, version?: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database blocked'));
    });
  }

  private async getDatabaseInfo(db: IDBDatabase): Promise<DatabaseInfo> {
    const objectStores: ObjectStoreInfo[] = [];
    let totalSize = 0;

    for (let i = 0; i < db.objectStoreNames.length; i++) {
      const storeName = db.objectStoreNames[i];

      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);

        const storeInfo = await this.getObjectStoreInfo(store);
        objectStores.push(storeInfo);
        totalSize += storeInfo.recordCount * 100; // 估算大小
      } catch (error) {
        console.error(`Failed to get info for store ${storeName}:`, error);
      }
    }

    return {
      name: db.name,
      version: db.version,
      objectStores,
      size: totalSize,
    };
  }

  private async getObjectStoreInfo(store: IDBObjectStore): Promise<ObjectStoreInfo> {
    const indexes: IndexInfo[] = [];

    for (let i = 0; i < store.indexNames.length; i++) {
      const indexName = store.indexNames[i];
      const index = store.index(indexName);

      indexes.push({
        name: index.name,
        keyPath: index.keyPath,
        unique: index.unique,
        multiEntry: index.multiEntry,
      });
    }

    const recordCount = await this.getRecordCount(store);

    return {
      name: store.name,
      keyPath: store.keyPath,
      autoIncrement: store.autoIncrement,
      indexes,
      recordCount,
    };
  }

  private async getRecordCount(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getObjectStores(dbName: string): Promise<ObjectStoreInfo[]> {
    const db = await this.openDatabase(dbName);
    const info = await this.getDatabaseInfo(db);
    db.close();
    return info.objectStores;
  }

  private async getStoreData(dbName: string, storeName: string, limit: number = 10): Promise<any[]> {
    const db = await this.openDatabase(dbName);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll(undefined, limit);

      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  private async deleteDatabase(dbName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database deletion blocked'));
    });
  }
}

// 初始化Worker
new IndexedDBWorker();

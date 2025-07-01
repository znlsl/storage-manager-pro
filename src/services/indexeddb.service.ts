// IndexedDB 服务
// 混合方案：使用 chrome.scripting.executeScript 获取数据 + Web Worker 处理数据

import { ChromeService } from './chrome.service';

export interface IndexedDBInfo {
  name: string;
  version: number;
  objectStores: ObjectStoreInfo[];
  size: number;
}

export interface ObjectStoreInfo {
  name: string;
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  indexes: IndexInfo[];
  recordCount: number;
  sampleData?: any[];
}

export interface IndexInfo {
  name: string;
  keyPath: string | string[];
  unique: boolean;
  multiEntry: boolean;
}

interface WorkerMessage {
  id: string;
  type: 'processData' | 'formatData' | 'searchData';
  payload?: any;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

export class IndexedDBService {
  private static worker: Worker | null = null;
  private static pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  /**
   * 根据域名获取对应的标签页
   */
  private static async getTabByDomain(domain: string): Promise<chrome.tabs.Tab | null> {
    try {
      const chromeTab = await ChromeService.getTabByDomain(domain);
      if (!chromeTab || !chromeTab.id) {
        console.error(`[IndexedDB Service] No accessible tab found for domain: ${domain}`);
        return null;
      }

      // 转换为chrome.tabs.Tab格式
      const tab = await chrome.tabs.get(chromeTab.id);
      return tab;
    } catch (error) {
      console.error(`[IndexedDB Service] Failed to get tab for domain ${domain}:`, error);
      return null;
    }
  }

  /**
   * 获取当前活跃标签页
   */
  private static async getCurrentActiveTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const chromeTab = await ChromeService.getActiveTab();
      if (!chromeTab || !chromeTab.id) {
        console.error('[IndexedDB Service] No active tab found');
        return null;
      }

      // 转换为chrome.tabs.Tab格式
      const tab = await chrome.tabs.get(chromeTab.id);
      return tab;
    } catch (error) {
      console.error('[IndexedDB Service] Failed to get current tab:', error);
      return null;
    }
  }


  /**
   * 初始化 Web Worker (用于数据处理)
   */
  private static initWorker(): Worker {
    if (!this.worker) {
      // 创建 Worker
      const workerCode = `
        // IndexedDB 数据处理 Web Worker
        ${this.getWorkerCode()}
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);

      this.worker = new Worker(workerUrl);
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
      this.worker.addEventListener('error', this.handleWorkerError.bind(this));

      // 清理 URL
      URL.revokeObjectURL(workerUrl);
    }

    return this.worker;
  }

  /**
   * 处理 Worker 消息
   */
  private static handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const { id, success, data, error } = event.data;
    const request = this.pendingRequests.get(id);

    if (request) {
      this.pendingRequests.delete(id);

      if (success) {
        request.resolve(data);
      } else {
        request.reject(new Error(error || 'Worker operation failed'));
      }
    }
  }

  /**
   * 处理 Worker 错误
   */
  private static handleWorkerError(error: ErrorEvent) {
    console.error('IndexedDB Worker error:', error);

    // 拒绝所有待处理的请求
    for (const [id, request] of this.pendingRequests) {
      request.reject(new Error('Worker error'));
      this.pendingRequests.delete(id);
    }
  }

  /**
   * 发送消息到 Worker
   */
  private static sendWorkerMessage<T>(type: string, payload?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = this.initWorker();
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.pendingRequests.set(id, { resolve, reject });

      const message: WorkerMessage = { id, type: type as any, payload };
      worker.postMessage(message);

      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker operation timeout'));
        }
      }, 30000); // 30秒超时
    });
  }

  /**
   * 获取所有 IndexedDB 数据库信息
   * 混合方案：使用 chrome.scripting.executeScript 获取数据，Web Worker 处理数据
   */
  static async getDatabases(domain?: string): Promise<IndexedDBInfo[]> {
    try {
      console.log(`[IndexedDB Service] Starting to get databases for domain: ${domain || 'current'}`);

      // 第一步：根据域名获取对应的标签页
      let tab: chrome.tabs.Tab | null;

      if (domain) {
        tab = await this.getTabByDomain(domain);
        if (!tab) {
          console.error(`[IndexedDB Service] No accessible tab found for domain: ${domain}`);
          return [];
        }
      } else {
        tab = await this.getCurrentActiveTab();
        if (!tab) {
          console.error('[IndexedDB Service] No active tab found');
          return [];
        }
      }

      if (!tab.url || !ChromeService.isValidDomainUrl(tab.url)) {
        console.log(`[IndexedDB Service] Tab URL is not accessible for IndexedDB: ${tab.url}`);
        return [];
      }

      console.log(`[IndexedDB Service] Getting IndexedDB data from tab: ${tab.url} (ID: ${tab.id})`);

      // 第二步：在页面上下文中执行脚本获取IndexedDB数据
      console.log('[IndexedDB Service] About to execute script in page context...');
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: async () => {
          try {
            console.log('[IndexedDB Script] Starting IndexedDB data collection...');

            // 格式化字节大小的辅助函数
            const formatBytes = (bytes: number) => {
              if (bytes === 0) {
                return '0 Bytes';
              }
              const k = 1024;
              const sizes = ['Bytes', 'KB', 'MB', 'GB'];
              const i = Math.floor(Math.log(bytes) / Math.log(k));
              return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            // 检查IndexedDB支持
            if (!('indexedDB' in window)) {
              console.log('[IndexedDB Script] IndexedDB not supported in this context');
              return [];
            }

            console.log('[IndexedDB Script] IndexedDB is available, getting databases...');

            // 获取所有数据库
            const databases = await indexedDB.databases();
            console.log(`[IndexedDB Script] Found ${databases.length} databases:`, databases.map(db => db.name));
            const dbInfo = [];

            for (const db of databases) {
              try {
                console.log(`[IndexedDB Script] Processing database: ${db.name}`);
                const openReq = indexedDB.open(db.name!);
                await new Promise<void>((resolve) => {
                  openReq.onsuccess = async () => {
                    const database = openReq.result;
                    const stores = [];
                    const objectStoreNames = Array.from(database.objectStoreNames);

                    for (const storeName of objectStoreNames) {
                      try {
                        const transaction = database.transaction([storeName], 'readonly');
                        const store = transaction.objectStore(storeName);

                        // 获取记录数量
                        const countReq = store.count();
                        const count = await new Promise((resolve) => {
                          countReq.onsuccess = () => resolve(countReq.result);
                          countReq.onerror = () => resolve(0);
                        });

                        // 获取样本数据（智能处理大数据）
                        const sampleReq = store.getAll(undefined, 10);
                        const sampleData = await new Promise((resolve) => {
                          sampleReq.onsuccess = () => {
                            const rawData = sampleReq.result;
                            console.log(`[IndexedDB Script] Processing ${rawData.length} sample records for store: ${storeName}`);

                            // 智能处理大数据
                            const processedData = rawData.map((item, index) => {
                              try {
                                // 计算数据大小
                                const itemJson = JSON.stringify(item);
                                const itemSize = new Blob([itemJson]).size;

                                console.log(`[IndexedDB Script] Record ${index + 1} size: ${itemSize} bytes`);

                                // 如果数据过大（超过10KB），进行智能截断
                                if (itemSize > 10240) { // 10KB限制
                                  console.log(`[IndexedDB Script] Large data detected (${itemSize} bytes), creating preview...`);

                                  if (typeof item === 'object' && item !== null) {
                                    const preview = {
                                      _isLargeData: true,
                                      _originalSize: itemSize,
                                      _sizeFormatted: formatBytes(itemSize),
                                      _recordIndex: index + 1,
                                      _keys: Object.keys(item),
                                      _preview: {} as any,
                                    };

                                    // 为每个字段创建预览
                                    Object.keys(item).forEach(key => {
                                      const value = item[key];
                                      if (typeof value === 'string') {
                                        if (value.length > 200) {
                                          preview._preview[key] = {
                                            type: 'string',
                                            length: value.length,
                                            preview: value.substring(0, 200) + '...',
                                            isTruncated: true,
                                          };
                                        } else {
                                          preview._preview[key] = value;
                                        }
                                      } else if (typeof value === 'object' && value !== null) {
                                        preview._preview[key] = {
                                          type: 'object',
                                          keys: Object.keys(value),
                                          preview: '[Object with ' + Object.keys(value).length + ' properties]',
                                        };
                                      } else if (Array.isArray(value)) {
                                        preview._preview[key] = {
                                          type: 'array',
                                          length: value.length,
                                          preview: '[Array with ' + value.length + ' items]',
                                        };
                                      } else {
                                        preview._preview[key] = value;
                                      }
                                    });

                                    return preview;
                                  } else {
                                    // 非对象类型的大数据
                                    return {
                                      _isLargeData: true,
                                      _originalSize: itemSize,
                                      _sizeFormatted: formatBytes(itemSize),
                                      _recordIndex: index + 1,
                                      _type: typeof item,
                                      _preview: typeof item === 'string'
                                        ? item.substring(0, 500) + '...'
                                        : '[Large ' + typeof item + ' data]',
                                    };
                                  }
                                } else {
                                  // 小数据直接返回
                                  return {
                                    ...item,
                                    _isLargeData: false,
                                    _originalSize: itemSize,
                                    _recordIndex: index + 1,
                                  };
                                }
                              } catch (error) {
                                console.error(`[IndexedDB Script] Error processing record ${index + 1}:`, error);
                                return {
                                  _isLargeData: false,
                                  _error: 'Failed to process record: ' + (error instanceof Error ? error.message : String(error)),
                                  _recordIndex: index + 1,
                                };
                              }
                            });

                            resolve(processedData);
                          };
                          sampleReq.onerror = () => resolve([]);
                        });

                        // 获取索引信息
                        const indexes = [];
                        for (const indexName of store.indexNames) {
                          try {
                            const index = store.index(indexName);
                            indexes.push({
                              name: indexName,
                              keyPath: index.keyPath,
                              unique: index.unique,
                              multiEntry: index.multiEntry,
                            });
                          } catch (indexError) {
                            console.warn(`Failed to get index info for ${indexName}:`, indexError);
                          }
                        }

                        stores.push({
                          name: storeName,
                          keyPath: store.keyPath,
                          autoIncrement: store.autoIncrement,
                          indexes: indexes,
                          recordCount: count as number,
                          sampleData: sampleData,
                        });
                      } catch (error) {
                        console.error(`Failed to process store ${storeName}:`, error);
                        stores.push({
                          name: storeName,
                          keyPath: null,
                          autoIncrement: false,
                          indexes: [],
                          recordCount: 0,
                          sampleData: [],
                        });
                      }
                    }

                    dbInfo.push({
                      name: db.name!,
                      version: database.version,
                      objectStores: stores,
                      size: stores.reduce((sum: number, store: any) => sum + (store.recordCount || 0) * 100, 0),
                    });

                    database.close();
                    resolve();
                  };

                  openReq.onerror = () => {
                    console.error(`Failed to open database ${db.name}:`, openReq.error);
                    dbInfo.push({
                      name: db.name!,
                      version: 0,
                      objectStores: [],
                      size: 0,
                    });
                    resolve();
                  };
                });
              } catch (error) {
                console.error(`Failed to process database ${db.name}:`, error);
                dbInfo.push({
                  name: db.name!,
                  version: 0,
                  objectStores: [],
                  size: 0,
                });
              }
            }

            console.log(`[IndexedDB Script] Completed processing, returning ${dbInfo.length} databases`);
            return dbInfo;
          } catch (error) {
            console.error('[IndexedDB Script] Failed to get IndexedDB data:', error);
            return [];
          }
        },
      });

      console.log('[IndexedDB Service] Script execution completed, result:', result);

      if (!result || !result[0]) {
        console.error('[IndexedDB Service] No result from script execution');
        return [];
      }

      if (!result[0].result) {
        console.log('[IndexedDB Service] Script returned empty result');
        return [];
      }

      const rawData = result[0].result;
      console.log(`[IndexedDB Service] Found ${rawData.length} databases:`, rawData);

      // 第三步：使用Web Worker处理大量数据（如果需要）
      if (rawData.length > 0) {
        try {
          const processedData = await this.sendWorkerMessage<IndexedDBInfo[]>('processData', rawData);
          return processedData;
        } catch (workerError) {
          console.warn('[IndexedDB Service] Worker processing failed, using main thread:', workerError);
          // 降级到主线程处理
          return this.processDataInMainThread(rawData);
        }
      }

      return rawData;
    } catch (error) {
      console.error('[IndexedDB Service] Failed to get databases:', error);
      return [];
    }
  }

  /**
   * 主线程数据处理（降级方案）
   */
  private static processDataInMainThread(rawData: any[]): IndexedDBInfo[] {
    try {
      console.log('[IndexedDB Service] Processing data in main thread');

      // 简单的数据处理和验证
      return rawData.map(db => ({
        name: db.name || 'Unknown',
        version: db.version || 0,
        objectStores: (db.objectStores || []).map((store: any) => ({
          name: store.name || 'Unknown',
          keyPath: store.keyPath || null,
          autoIncrement: store.autoIncrement || false,
          indexes: store.indexes || [],
          recordCount: store.recordCount || 0,
          sampleData: store.sampleData || [],
        })),
        size: db.size || 0,
      }));
    } catch (error) {
      console.error('[IndexedDB Service] Failed to process data in main thread:', error);
      return [];
    }
  }

  /**
   * 获取数据库的对象存储信息
   */
  static async getObjectStores(dbName: string, domain?: string): Promise<ObjectStoreInfo[]> {
    try {
      const databases = await this.getDatabases(domain);
      const targetDb = databases.find(db => db.name === dbName);
      return targetDb ? targetDb.objectStores : [];
    } catch (error) {
      console.error('Failed to get object stores:', error);
      return [];
    }
  }

  /**
   * 获取对象存储的样本数据
   */
  static async getStoreData(dbName: string, storeName: string, limit: number = 10, domain?: string): Promise<any[]> {
    try {
      const objectStores = await this.getObjectStores(dbName, domain);
      const targetStore = objectStores.find(store => store.name === storeName);
      return targetStore && targetStore.sampleData ? targetStore.sampleData.slice(0, limit) : [];
    } catch (error) {
      console.error('Failed to get store data:', error);
      return [];
    }
  }

  /**
   * 删除数据库
   */
  static async deleteDatabase(dbName: string, domain?: string): Promise<boolean> {
    try {
      let tab: chrome.tabs.Tab | null;

      if (domain) {
        tab = await this.getTabByDomain(domain);
      } else {
        tab = await this.getCurrentActiveTab();
      }

      if (!tab || !tab.url || !ChromeService.isValidDomainUrl(tab.url)) {
        console.error('[IndexedDB Service] No accessible tab found for database deletion');
        return false;
      }

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: (name: string) => {
          return new Promise<boolean>((resolve) => {
            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
          });
        },
        args: [dbName],
      });

      return result && result[0] && result[0].result === true;
    } catch (error) {
      console.error('Failed to delete database:', error);
      return false;
    }
  }


  /**
   * 获取 Worker 代码
   */
  private static getWorkerCode(): string {
    return `
      // Worker 代码会在这里内联
      // 由于文件大小限制，这里使用简化版本
      
      class IndexedDBDataProcessor {
        constructor() {
          self.addEventListener('message', this.handleMessage.bind(this));
        }

        async handleMessage(event) {
          const { id, type, payload } = event.data;

          try {
            let result;

            switch (type) {
              case 'processData':
                result = await this.processData(payload);
                break;
              case 'formatData':
                result = await this.formatData(payload);
                break;
              case 'searchData':
                result = await this.searchData(payload.data, payload.searchTerm, payload.caseSensitive);
                break;
              default:
                throw new Error('Unknown operation type: ' + type);
            }

            self.postMessage({ id, success: true, data: result });
          } catch (error) {
            self.postMessage({ id, success: false, error: error.message });
          }
        }

        async processData(rawData) {
          // 处理和验证从页面获取的IndexedDB数据
          console.log('[Worker] Processing IndexedDB data...');

          if (!Array.isArray(rawData)) {
            return [];
          }

          const processedData = rawData.map(db => {
            // 数据清理和验证
            const processedDb = {
              name: db.name || 'Unknown Database',
              version: Number(db.version) || 0,
              objectStores: [],
              size: 0
            };

            if (Array.isArray(db.objectStores)) {
              processedDb.objectStores = db.objectStores.map(store => {
                const processedStore = {
                  name: store.name || 'Unknown Store',
                  keyPath: store.keyPath || null,
                  autoIncrement: Boolean(store.autoIncrement),
                  indexes: Array.isArray(store.indexes) ? store.indexes : [],
                  recordCount: Number(store.recordCount) || 0,
                  sampleData: Array.isArray(store.sampleData) ? store.sampleData : []
                };

                // 处理样本数据，确保可序列化
                processedStore.sampleData = processedStore.sampleData.map(item => {
                  try {
                    return JSON.parse(JSON.stringify(item));
                  } catch (error) {
                    return { error: 'Non-serializable data', type: typeof item };
                  }
                });

                return processedStore;
              });

              // 计算数据库大小估算
              processedDb.size = processedDb.objectStores.reduce(
                (sum, store) => sum + store.recordCount * 100,
                0
              );
            }

            return processedDb;
          });

          console.log('[Worker] Data processing completed');
          return processedData;
        }

        async formatData(data) {
          // 格式化数据用于显示
          if (!Array.isArray(data)) {
            return [];
          }

          return data.map(db => ({
            ...db,
            formattedSize: this.formatSize(db.size || 0),
            totalRecords: db.objectStores.reduce((sum, store) => sum + store.recordCount, 0)
          }));
        }

        async searchData(data, searchTerm, caseSensitive = false) {
          // 在数据中搜索
          if (!Array.isArray(data) || !searchTerm) {
            return data;
          }

          const searchText = caseSensitive ? searchTerm : searchTerm.toLowerCase();

          return data.filter(db => {
            const dbName = caseSensitive ? db.name : db.name.toLowerCase();

            if (dbName.includes(searchText)) {
              return true;
            }

            return db.objectStores.some(store => {
              const storeName = caseSensitive ? store.name : store.name.toLowerCase();
              return storeName.includes(searchText);
            });
          });
        }

        formatSize(size) {
          if (size < 1024) return size + ' B';
          if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
          return (size / (1024 * 1024)).toFixed(1) + ' MB';
        }

      }

      new IndexedDBDataProcessor();
    `;
  }

  /**
   * 清理资源
   */
  static cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.pendingRequests.clear();
  }
}

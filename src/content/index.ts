// Content Script
import type { ChromeMessage, ChromeResponse } from '../types/chrome.types';
import { ExtensionContextUtils } from '../utils/extension-context.utils';

class ContentScript {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // 监听来自 background script 和 popup 的消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // 监听页面的存储事件
    this.setupStorageListeners();

    this.isInitialized = true;
    console.log('Storage Manager Pro content script initialized on:', window.location.hostname);
  }

  private handleMessage(
    message: ChromeMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ChromeResponse) => void,
  ): boolean {
    console.log('Content script received message:', message.type);

    switch (message.type) {
      case 'GET_STORAGE_DATA':
        this.handleGetStorageData(
          message.payload as { storageType: 'localStorage' | 'sessionStorage' },
          sendResponse,
        );
        break;

      case 'SET_STORAGE_ITEM':
        this.handleSetStorageItem(
          message.payload as {
            storageType: 'localStorage' | 'sessionStorage';
            key: string;
            value: string;
          },
          sendResponse,
        );
        break;

      case 'DELETE_STORAGE_ITEM':
        this.handleDeleteStorageItem(
          message.payload as {
            storageType: 'localStorage' | 'sessionStorage';
            key: string;
          },
          sendResponse,
        );
        break;

      case 'CLEAR_STORAGE':
        this.handleClearStorage(
          message.payload as { storageType: 'localStorage' | 'sessionStorage' },
          sendResponse,
        );
        break;

      default:
        sendResponse({
          success: false,
          error: `Unknown message type: ${message.type}`,
        });
        break;
    }

    // 返回 true 表示异步响应
    return true;
  }

  private handleGetStorageData(
    payload: { storageType: 'localStorage' | 'sessionStorage' },
    sendResponse: (response: ChromeResponse) => void,
  ): void {
    try {
      const storage = payload.storageType === 'localStorage' ? localStorage : sessionStorage;
      const items: Array<{ key: string; value: string; size: number }> = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          const value = storage.getItem(key) || '';
          items.push({
            key,
            value,
            size: new Blob([value]).size,
          });
        }
      }

      sendResponse({
        success: true,
        data: {
          items,
          domain: window.location.hostname,
          storageType: payload.storageType,
        },
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get storage data',
      });
    }
  }

  private handleSetStorageItem(
    payload: {
      storageType: 'localStorage' | 'sessionStorage';
      key: string;
      value: string;
    },
    sendResponse: (response: ChromeResponse) => void,
  ): void {
    try {
      const storage = payload.storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.setItem(payload.key, payload.value);

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set storage item',
      });
    }
  }

  private handleDeleteStorageItem(
    payload: {
      storageType: 'localStorage' | 'sessionStorage';
      key: string;
    },
    sendResponse: (response: ChromeResponse) => void,
  ): void {
    try {
      const storage = payload.storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem(payload.key);

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete storage item',
      });
    }
  }

  private handleClearStorage(
    payload: { storageType: 'localStorage' | 'sessionStorage' },
    sendResponse: (response: ChromeResponse) => void,
  ): void {
    try {
      const storage = payload.storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.clear();

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear storage',
      });
    }
  }

  private setupStorageListeners(): void {
    // 监听 storage 事件
    window.addEventListener('storage', (event) => {
      console.log('Storage event detected:', {
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
        storageArea: event.storageArea === localStorage ? 'localStorage' : 'sessionStorage',
      });

      // 可以在这里通知 background script 存储变化
      this.notifyStorageChange(event);
    });
  }

  private notifyStorageChange(event: StorageEvent): void {
    ExtensionContextUtils.sendMessageWithRetry({
      type: 'STORAGE_CHANGED',
      payload: {
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
        storageArea: event.storageArea === localStorage ? 'localStorage' : 'sessionStorage',
        domain: window.location.hostname,
      },
    }).catch(error => {
      console.error('Failed to notify storage change:', error);
    });
  }

  // 提供一些工具方法供页面脚本使用
  public getStorageInfo(): {
    localStorage: { count: number; size: number };
    sessionStorage: { count: number; size: number };
    } {
    const getStorageStats = (storage: Storage) => {
      let totalSize = 0;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          const value = storage.getItem(key) || '';
          totalSize += new Blob([key + value]).size;
        }
      }
      return {
        count: storage.length,
        size: totalSize,
      };
    };

    return {
      localStorage: getStorageStats(localStorage),
      sessionStorage: getStorageStats(sessionStorage),
    };
  }

  public exportStorage(storageType: 'localStorage' | 'sessionStorage'): string {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      const data: Record<string, string> = {};

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          data[key] = storage.getItem(key) || '';
        }
      }

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export storage:', error);
      return '{}';
    }
  }

  public importStorage(
    storageType: 'localStorage' | 'sessionStorage',
    data: string,
    clearFirst = false,
  ): boolean {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      const parsedData = JSON.parse(data);

      if (clearFirst) {
        storage.clear();
      }

      Object.entries(parsedData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          storage.setItem(key, value);
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to import storage:', error);
      return false;
    }
  }
}

// 初始化 content script
new ContentScript();

// 将一些方法暴露到全局，供调试使用
if (typeof window !== 'undefined') {
  (window as any).StorageManagerPro = {
    getStorageInfo: () => new ContentScript().getStorageInfo(),
    exportStorage: (type: 'localStorage' | 'sessionStorage') =>
      new ContentScript().exportStorage(type),
    importStorage: (
      type: 'localStorage' | 'sessionStorage',
      data: string,
      clearFirst = false,
    ) => new ContentScript().importStorage(type, data, clearFirst),
  };
}

// Content Script
import type { ChromeMessage, ChromeResponse } from '../types/chrome.types';
import { ExtensionContextUtils, ExtensionStateManager, ExtensionState } from '../utils/extension-context.utils';

class ContentScript {
  private isInitialized = false;
  private stateManager: ExtensionStateManager;
  private isListening = false; // 是否正在监听storage事件
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private stateCheckInterval: number | null = null;

  constructor() {
    this.stateManager = ExtensionStateManager.getInstance();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // 监听来自 background script 和 popup 的消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // 设置扩展状态监听
    this.setupExtensionStateManagement();

    // 设置页面生命周期监听器
    this.setupPageLifecycleListeners();

    this.isInitialized = true;
    console.log('Storage Manager Pro content script initialized on:', window.location.hostname);
  }

  /**
   * 设置扩展状态管理
   */
  private setupExtensionStateManagement(): void {
    // 监听扩展状态变化
    this.stateManager.onStateChange((state: ExtensionState) => {
      console.log('Extension state changed to:', state);

      if (state === ExtensionState.AVAILABLE) {
        this.startStorageListening();
      } else if (state === ExtensionState.DISABLED || state === ExtensionState.UNAVAILABLE) {
        this.stopStorageListening();
      }
    });

    // 定期检查扩展状态
    this.stateCheckInterval = window.setInterval(async () => {
      await this.stateManager.checkExtensionState();
    }, 10000); // 每10秒检查一次

    // 初始状态检查
    this.stateManager.checkExtensionState().then((state) => {
      if (state === ExtensionState.AVAILABLE) {
        this.startStorageListening();
      }
    });
  }

  /**
   * 开始监听storage事件
   */
  private startStorageListening(): void {
    if (this.isListening || this.storageListener) {
      return; // 已经在监听了
    }

    console.log('Starting storage event listening');

    this.storageListener = this.handleStorageChange.bind(this);
    window.addEventListener('storage', this.storageListener);
    this.isListening = true;
  }

  /**
   * 停止监听storage事件
   */
  private stopStorageListening(): void {
    if (!this.isListening || !this.storageListener) {
      return; // 没有在监听
    }

    console.log('Stopping storage event listening');

    window.removeEventListener('storage', this.storageListener);
    this.storageListener = null;
    this.isListening = false;
  }

  /**
   * 处理storage变化事件
   */
  private handleStorageChange(event: StorageEvent): void {
    console.log('Storage event detected:', {
      key: event.key,
      oldValue: event.oldValue,
      newValue: event.newValue,
      storageArea: event.storageArea === localStorage ? 'localStorage' : 'sessionStorage',
    });

    // 通知 background script 存储变化
    this.notifyStorageChange(event);
  }

  private handleMessage(
    message: ChromeMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ChromeResponse) => void,
  ): boolean {
    console.log('Content script received message:', message.type);

    // 当收到任何扩展消息时，说明扩展正在被使用，确保开始监听storage事件
    if (!this.isListening) {
      console.log('Extension message received, starting storage listeners');
      this.startStorageListening();
      // 重置状态管理器，因为扩展显然是可用的
      this.stateManager.reset();
      this.stateManager.checkExtensionState();
    }

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



  private notifyTimeout: number | null = null;

  private notifyStorageChange(event: StorageEvent): void {
    // 添加防抖机制，避免频繁的消息发送
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
    }

    this.notifyTimeout = setTimeout(async () => {
      try {
        // 检查扩展状态
        const currentState = await this.stateManager.checkExtensionState();

        // 如果扩展被禁用或不可用，跳过通知
        if (currentState === ExtensionState.DISABLED) {
          console.log('Extension is disabled, skipping storage change notification');
          return;
        }

        if (currentState === ExtensionState.UNAVAILABLE) {
          console.log('Extension is unavailable, skipping storage change notification');
          return;
        }

        // 检查当前页面是否是特殊页面（如claude.ai）
        const isSpecialSite = this.isSpecialSite();
        if (isSpecialSite) {
          console.log('Detected special site, using enhanced error handling');
        }

        await ExtensionContextUtils.sendMessageWithRetry({
          type: 'STORAGE_CHANGED',
          payload: {
            key: event.key,
            oldValue: event.oldValue,
            newValue: event.newValue,
            storageArea: event.storageArea === localStorage ? 'localStorage' : 'sessionStorage',
            domain: window.location.hostname,
            timestamp: Date.now(),
            url: window.location.href,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // 如果是扩展被禁用的错误，停止监听
        if (errorMessage.includes('Extension is disabled')) {
          console.warn('Extension is disabled, stopping storage listening');
          this.stopStorageListening();
        } else if (ExtensionContextUtils.isContextInvalidatedError(errorMessage)) {
          console.warn('Extension context invalidated during storage notification');
          // 让状态管理器重新检查状态
          this.stateManager.forceCheck();
        } else {
          console.error('Failed to notify storage change:', error);
        }
      }
    }, 100); // 100ms防抖
  }

  /**
   * 检查是否是特殊网站（如claude.ai）
   */
  private isSpecialSite(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    const specialSites = [
      'claude.ai',
      'chat.openai.com',
      'bard.google.com',
      'www.bing.com'
    ];

    return specialSites.some(site => hostname.includes(site));
  }



  /**
   * 设置页面生命周期监听器
   */
  private setupPageLifecycleListeners(): void {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking extension state');
        this.stateManager.forceCheck();
      }
    });

    // 监听页面焦点变化
    window.addEventListener('focus', () => {
      console.log('Page gained focus, checking extension state');
      this.stateManager.forceCheck();
    });

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      console.log('Page is being unloaded');
      if (this.notifyTimeout) {
        clearTimeout(this.notifyTimeout);
      }
      if (this.stateCheckInterval) {
        clearInterval(this.stateCheckInterval);
      }
      this.stopStorageListening();
    });

    // 监听页面错误
    window.addEventListener('error', (event) => {
      if (event.error && ExtensionContextUtils.isContextInvalidatedError(event.error.message)) {
        console.warn('Detected extension context error in page:', event.error.message);
        this.stateManager.forceCheck();
      }
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

// 存储管理服务 - 专门处理 localStorage 和 sessionStorage
import type {
  StorageItem,
} from '../types/storage.types';
import type {
  StorageData,
} from '../types/chrome.types';
import { ChromeService } from './chrome.service';

export class StorageService {
  /**
   * 根据域名获取标签页ID
   */
  private static async getTabIdByDomain(domain: string): Promise<number | null> {
    const tab = await ChromeService.getTabByDomain(domain);
    return tab?.id || null;
  }

  /**
   * 获取当前活动标签页ID
   */
  private static async getActiveTabId(): Promise<number | null> {
    const tab = await ChromeService.getActiveTab();
    return tab?.id || null;
  }

  // ==================== localStorage 相关方法 ====================

  /**
   * 获取 localStorage 数据
   */
  static async getLocalStorage(domain?: string): Promise<StorageItem[]> {
    try {
      let tabId: number | null;

      if (domain) {
        tabId = await this.getTabIdByDomain(domain);
      } else {
        tabId = await this.getActiveTabId();
      }

      if (!tabId) {
        console.warn('No accessible tab found');
        return [];
      }

      const response = await ChromeService.getLocalStorage(tabId);

      if (!response.success || !response.data) {
        console.error('Failed to get localStorage:', response.error);
        return [];
      }

      const items: StorageItem[] = [];
      const data = response.data as StorageData;

      Object.entries(data).forEach(([key, value]) => {
        items.push({
          key,
          value,
          type: 'localStorage',
          domain: domain || 'unknown',
          size: new Blob([value]).size,
          lastModified: Date.now(),
        });
      });

      return items;
    } catch (error) {
      console.error('Failed to get localStorage:', error);
      return [];
    }
  }

  /**
   * 获取 sessionStorage 数据
   */
  static async getSessionStorage(domain?: string): Promise<StorageItem[]> {
    try {
      let tabId: number | null;

      if (domain) {
        tabId = await this.getTabIdByDomain(domain);
      } else {
        tabId = await this.getActiveTabId();
      }

      if (!tabId) {
        console.warn('No accessible tab found');
        return [];
      }

      const response = await ChromeService.getSessionStorage(tabId);

      if (!response.success || !response.data) {
        console.error('Failed to get sessionStorage:', response.error);
        return [];
      }

      const items: StorageItem[] = [];
      const data = response.data as StorageData;

      Object.entries(data).forEach(([key, value]) => {
        items.push({
          key,
          value,
          type: 'sessionStorage',
          domain: domain || 'unknown',
          size: new Blob([value]).size,
          lastModified: Date.now(),
        });
      });

      return items;
    } catch (error) {
      console.error('Failed to get sessionStorage:', error);
      return [];
    }
  }

  /**
   * 设置 localStorage 项目
   */
  static async setLocalStorageItem(
    key: string,
    value: string,
    domain?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let tabId: number | null;

      if (domain) {
        tabId = await this.getTabIdByDomain(domain);
        if (!tabId) {
          const errorMsg = `无法找到域名 "${domain}" 对应的可访问标签页。请确保该域名的网页已打开且不是Chrome内部页面。`;
          console.error('No accessible tab found for domain:', domain);
          return { success: false, error: errorMsg };
        }
      } else {
        tabId = await this.getActiveTabId();
        if (!tabId) {
          const errorMsg = '无法找到可访问的标签页。请打开一个普通网页（非Chrome内部页面）后重试。';
          console.error('No accessible tab found');
          return { success: false, error: errorMsg };
        }
      }

      const response = await ChromeService.setLocalStorageItem(tabId, key, value);
      if (response.success && response.data === true) {
        return { success: true };
      } else {
        const errorMsg = response.error || '设置localStorage项目失败';
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Failed to set localStorage item:', error);
      const errorMsg = error instanceof Error ? error.message : '设置localStorage项目时发生未知错误';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 设置 sessionStorage 项目
   */
  static async setSessionStorageItem(
    key: string,
    value: string,
    domain?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let tabId: number | null;

      if (domain) {
        tabId = await this.getTabIdByDomain(domain);
        if (!tabId) {
          const errorMsg = `无法找到域名 "${domain}" 对应的可访问标签页。请确保该域名的网页已打开且不是Chrome内部页面。`;
          console.error('No accessible tab found for domain:', domain);
          return { success: false, error: errorMsg };
        }
      } else {
        tabId = await this.getActiveTabId();
        if (!tabId) {
          const errorMsg = '无法找到可访问的标签页。请打开一个普通网页（非Chrome内部页面）后重试。';
          console.error('No accessible tab found');
          return { success: false, error: errorMsg };
        }
      }

      const response = await ChromeService.setSessionStorageItem(tabId, key, value);
      if (response.success && response.data === true) {
        return { success: true };
      } else {
        const errorMsg = response.error || '设置sessionStorage项目失败';
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Failed to set sessionStorage item:', error);
      const errorMsg = error instanceof Error ? error.message : '设置sessionStorage项目时发生未知错误';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 删除 localStorage 项目
   */
  static async deleteLocalStorageItem(key: string, domain?: string): Promise<{ success: boolean; error?: string }> {
    try {
      let tabId: number | null;

      if (domain) {
        tabId = await this.getTabIdByDomain(domain);
        if (!tabId) {
          const errorMsg = `无法找到域名 "${domain}" 对应的可访问标签页。请确保该域名的网页已打开且不是Chrome内部页面。`;
          console.error('No accessible tab found for domain:', domain);
          return { success: false, error: errorMsg };
        }
      } else {
        tabId = await this.getActiveTabId();
        if (!tabId) {
          const errorMsg = '无法找到可访问的标签页。请打开一个普通网页（非Chrome内部页面）后重试。';
          console.error('No accessible tab found');
          return { success: false, error: errorMsg };
        }
      }

      const response = await ChromeService.removeLocalStorageItem(tabId, key);
      if (response.success && response.data === true) {
        return { success: true };
      } else {
        const errorMsg = response.error || '删除localStorage项目失败';
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Failed to delete localStorage item:', error);
      const errorMsg = error instanceof Error ? error.message : '删除localStorage项目时发生未知错误';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 删除 sessionStorage 项目
   */
  static async deleteSessionStorageItem(key: string, domain?: string): Promise<{ success: boolean; error?: string }> {
    try {
      let tabId: number | null;

      if (domain) {
        tabId = await this.getTabIdByDomain(domain);
        if (!tabId) {
          const errorMsg = `无法找到域名 "${domain}" 对应的可访问标签页。请确保该域名的网页已打开且不是Chrome内部页面。`;
          console.error('No accessible tab found for domain:', domain);
          return { success: false, error: errorMsg };
        }
      } else {
        tabId = await this.getActiveTabId();
        if (!tabId) {
          const errorMsg = '无法找到可访问的标签页。请打开一个普通网页（非Chrome内部页面）后重试。';
          console.error('No accessible tab found');
          return { success: false, error: errorMsg };
        }
      }

      const response = await ChromeService.removeSessionStorageItem(tabId, key);
      if (response.success && response.data === true) {
        return { success: true };
      } else {
        const errorMsg = response.error || '删除sessionStorage项目失败';
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Failed to delete sessionStorage item:', error);
      const errorMsg = error instanceof Error ? error.message : '删除sessionStorage项目时发生未知错误';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 清空 localStorage
   */
  static async clearLocalStorage(domain?: string): Promise<boolean> {
    try {
      let tabId: number | null;

      if (domain) {
        tabId = await this.getTabIdByDomain(domain);
      } else {
        tabId = await this.getActiveTabId();
      }

      if (!tabId) {
        console.error('No accessible tab found');
        return false;
      }

      const response = await ChromeService.clearLocalStorage(tabId);
      return response.success && response.data === true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * 清空 sessionStorage
   */
  static async clearSessionStorage(domain?: string): Promise<boolean> {
    try {
      let tabId: number | null;

      if (domain) {
        tabId = await this.getTabIdByDomain(domain);
      } else {
        tabId = await this.getActiveTabId();
      }

      if (!tabId) {
        console.error('No accessible tab found');
        return false;
      }

      const response = await ChromeService.clearSessionStorage(tabId);
      return response.success && response.data === true;
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
      return false;
    }
  }


}

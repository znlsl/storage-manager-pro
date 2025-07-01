// Chrome API 服务
import type {
  ChromeTab,
  ChromeMessage,
  ChromeResponse,
  StorageData,
  CookieData,
} from '../types/chrome.types';
import { UtilsService } from './utils.service';
import { ExtensionContextUtils } from '../utils/extension-context.utils';

export class ChromeService {
  /**
   * 获取所有标签页
   */
  static async getAllTabs(): Promise<ChromeTab[]> {
    try {
      const tabs = await chrome.tabs.query({});
      return tabs.map(tab => ({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: tab.active,
        windowId: tab.windowId,
      }));
    } catch (error) {
      console.error('Failed to get tabs:', error);
      return [];
    }
  }


  /**
   * 获取触发插件的原始标签页信息
   */
  static async getTriggerTab(): Promise<ChromeTab | null> {
    try {
      const response = await ExtensionContextUtils.sendMessageWithRetry({
        type: 'GET_TRIGGER_TAB',
      });

      if (response && response.success) {
        return response.data as ChromeTab;
      }

      return null;
    } catch (error) {
      console.error('Failed to get trigger tab:', error);
      return null;
    }
  }

  /**
   * 获取当前活动标签页（适配新标签页环境）
   */
  static async getActiveTab(): Promise<ChromeTab | null> {
    try {
      // 首先尝试获取触发插件的原始标签页
      const triggerTab = await this.getTriggerTab();
      if (triggerTab && triggerTab.url && this.isValidDomainUrl(triggerTab.url)) {
        console.log('Using trigger tab as active tab:', triggerTab);
        return triggerTab;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        return null;
      }
      console.log('Current active tab:', tab);
      // 如果当前标签页是扩展页面，尝试获取最近访问的非扩展页面
      if (tab.url && tab.url.startsWith('chrome-extension://')) {
        const allTabs = await chrome.tabs.query({ currentWindow: true });
        const validTab = allTabs.find(t =>
          t.url && this.isValidDomainUrl(t.url),
        );

        if (validTab) {
          return {
            id: validTab.id,
            url: validTab.url,
            title: validTab.title,
            active: validTab.active,
            windowId: validTab.windowId,
          };
        }
      }

      return {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: tab.active,
        windowId: tab.windowId,
      };
    } catch (error) {
      console.error('Failed to get active tab:', error);
      return null;
    }
  }

  /**
   * 向标签页发送消息
   */
  static async sendMessageToTab<T = unknown>(
    tabId: number,
    message: ChromeMessage,
  ): Promise<ChromeResponse<T>> {
    try {
      const response = await ExtensionContextUtils.sendMessageToTabWithRetry<ChromeResponse<T>>(tabId, message);
      return response || { success: false, error: 'No response from tab' };
    } catch (error) {
      console.error('Failed to send message to tab:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }


  /**
   * 在标签页中执行脚本
   */
  static async executeScript<T = unknown>(
    tabId: number,
    func: (...args: unknown[]) => T,
    args: unknown[] = [],
  ): Promise<ChromeResponse<T>> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func,
        args,
      });

      if (results && results[0]) {
        return { success: true, data: results[0].result as T };
      }

      return { success: false, error: 'No result from script execution' };
    } catch (error) {
      console.error('Failed to execute script:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 根据域名获取对应的标签页
   */
  static async getTabByDomain(domain: string): Promise<ChromeTab | null> {
    try {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find(tab => {
        if (!tab.url || !this.isValidDomainUrl(tab.url)) {
          return false;
        }
        try {
          const url = new URL(tab.url);
          return url.hostname === domain;
        } catch (error) {
          return false;
        }
      });

      if (!tab) {
        return null;
      }

      return {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: tab.active,
        windowId: tab.windowId,
      };
    } catch (error) {
      console.error('Failed to get tab by domain:', error);
      return null;
    }
  }

  /**
   * 获取当前活跃标签页的域名
   */
  static async getCurrentDomain(): Promise<string | null> {
    try {
      const activeTab = await this.getActiveTab();
      if (!activeTab || !activeTab.url) {
        return null;
      }

      if (this.isValidDomainUrl(activeTab.url)) {
        try {
          const url = new URL(activeTab.url);
          return url.hostname;
        } catch (e) {
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get current domain:', error);
      return null;
    }
  }

  /**
   * 获取域名列表
   */
  static async getDomainList(): Promise<string[]> {
    try {
      const tabs = await this.getAllTabs();
      const domains = new Set<string>();

      tabs.forEach(tab => {
        if (tab.url && this.isValidDomainUrl(tab.url)) {
          try {
            const url = new URL(tab.url);
            if (url.hostname) {
              domains.add(url.hostname);
            }
          } catch (e) {
            // 忽略无效URL
          }
        }
      });

      return Array.from(domains).sort();
    } catch (error) {
      console.error('Failed to get domain list:', error);
      return [];
    }
  }

  /**
   * 打开新标签页
   */
  static async openTab(url: string): Promise<ChromeTab | null> {
    try {
      const tab = await chrome.tabs.create({ url });
      return {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: tab.active,
        windowId: tab.windowId,
      };
    } catch (error) {
      console.error('Failed to open tab:', error);
      return null;
    }
  }

  /**
   * 关闭标签页
   */
  static async closeTab(tabId: number): Promise<boolean> {
    try {
      await chrome.tabs.remove(tabId);
      return true;
    } catch (error) {
      console.error('Failed to close tab:', error);
      return false;
    }
  }

  /**
   * 检查URL是否为有效的域名URL
   */
  static isValidDomainUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // 排除的URL前缀
    const excludedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'edge://',
      'about:',
      'data:',
      'blob:',
      'file://',
      'ftp://',
    ];

    return !excludedPrefixes.some(prefix => url.startsWith(prefix));
  }

  /**
   * 检查是否有权限访问标签页
   */
  static async canAccessTab(tabId: number): Promise<boolean> {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab.url) {
        return false;
      }

      return this.isValidDomainUrl(tab.url);
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取存储权限
   */
  static async requestStoragePermission(): Promise<boolean> {
    try {
      return await chrome.permissions.request({
        permissions: ['storage'],
      });
    } catch (error) {
      console.error('Failed to request storage permission:', error);
      return false;
    }
  }

  /**
   * 检查是否有存储权限
   */
  static async hasStoragePermission(): Promise<boolean> {
    try {
      return await chrome.permissions.contains({
        permissions: ['storage'],
      });
    } catch (error) {
      console.error('Failed to check storage permission:', error);
      return false;
    }
  }

  // ==================== 存储相关方法 ====================

  /**
   * 获取localStorage数据
   */
  static async getLocalStorage(tabId: number): Promise<ChromeResponse<StorageData>> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const items: Record<string, string> = {};
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key) {
                items[key] = localStorage.getItem(key) || '';
              }
            }
          } catch (error) {
            console.error('获取localStorage失败:', error);
          }
          return items;
        },
      });

      if (results && results[0]) {
        return { success: true, data: results[0].result as StorageData };
      }

      return { success: false, error: 'No result from script execution' };
    } catch (error) {
      console.error('Failed to get localStorage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取sessionStorage数据
   */
  static async getSessionStorage(tabId: number): Promise<ChromeResponse<StorageData>> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const items: Record<string, string> = {};
          try {
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key) {
                items[key] = sessionStorage.getItem(key) || '';
              }
            }
          } catch (error) {
            console.error('获取sessionStorage失败:', error);
          }
          return items;
        },
      });

      if (results && results[0]) {
        return { success: true, data: results[0].result as StorageData };
      }

      return { success: false, error: 'No result from script execution' };
    } catch (error) {
      console.error('Failed to get sessionStorage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 设置localStorage项目
   */
  static async setLocalStorageItem(
    tabId: number,
    key: string,
    value: string,
  ): Promise<ChromeResponse<boolean>> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
            return { success: true };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        },
        args: [key, value],
      });

      if (results && results[0]) {
        const result = results[0].result as { success: boolean; error?: string };
        if (result.success) {
          return { success: true, data: true };
        } else {
          return { success: false, error: result.error || 'Failed to set localStorage item' };
        }
      }

      return { success: false, error: 'No result from script execution' };
    } catch (error) {
      console.error('Failed to set localStorage item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 设置sessionStorage项目
   */
  static async setSessionStorageItem(
    tabId: number,
    key: string,
    value: string,
  ): Promise<ChromeResponse<boolean>> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (key: string, value: string) => {
          try {
            sessionStorage.setItem(key, value);
            return { success: true };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        },
        args: [key, value],
      });

      if (results && results[0]) {
        const result = results[0].result as { success: boolean; error?: string };
        if (result.success) {
          return { success: true, data: true };
        } else {
          return { success: false, error: result.error || 'Failed to set sessionStorage item' };
        }
      }

      return { success: false, error: 'No result from script execution' };
    } catch (error) {
      console.error('Failed to set sessionStorage item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 删除localStorage项目
   */
  static async removeLocalStorageItem(
    tabId: number,
    key: string,
  ): Promise<ChromeResponse<boolean>> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (key: string) => {
          try {
            localStorage.removeItem(key);
            return { success: true };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        },
        args: [key],
      });

      if (results && results[0]) {
        const result = results[0].result as { success: boolean; error?: string };
        if (result.success) {
          return { success: true, data: true };
        } else {
          return { success: false, error: result.error || 'Failed to remove localStorage item' };
        }
      }

      return { success: false, error: 'No result from script execution' };
    } catch (error) {
      console.error('Failed to remove localStorage item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 删除sessionStorage项目
   */
  static async removeSessionStorageItem(
    tabId: number,
    key: string,
  ): Promise<ChromeResponse<boolean>> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (key: string) => {
          try {
            sessionStorage.removeItem(key);
            return { success: true };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        },
        args: [key],
      });

      if (results && results[0]) {
        const result = results[0].result as { success: boolean; error?: string };
        if (result.success) {
          return { success: true, data: true };
        } else {
          return { success: false, error: result.error || 'Failed to remove sessionStorage item' };
        }
      }

      return { success: false, error: 'No result from script execution' };
    } catch (error) {
      console.error('Failed to remove sessionStorage item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 清空localStorage
   */
  static async clearLocalStorage(tabId: number): Promise<ChromeResponse<boolean>> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          try {
            localStorage.clear();
            return { success: true, length: localStorage.length };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        },
      });

      if (results && results[0]) {
        const result = results[0].result as { success: boolean; error?: string };
        if (result.success) {
          return { success: true, data: true };
        } else {
          return { success: false, error: result.error || 'Failed to clear localStorage' };
        }
      }

      return { success: false, error: 'No result from script execution' };
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 清空sessionStorage
   */
  static async clearSessionStorage(tabId: number): Promise<ChromeResponse<boolean>> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          try {
            sessionStorage.clear();
            return { success: true, length: sessionStorage.length };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        },
      });

      if (results && results[0]) {
        const result = results[0].result as { success: boolean; error?: string };
        if (result.success) {
          return { success: true, data: true };
        } else {
          return { success: false, error: result.error || 'Failed to clear sessionStorage' };
        }
      }

      return { success: false, error: 'No result from script execution' };
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== Cookie相关方法 ====================

  /**
   * 获取Cookies
   */
  static async getCookies(url: string): Promise<ChromeResponse<CookieData[]>> {
    try {
      // 验证并构建有效的URL
      let validUrl = url;

      // 如果传入的是域名而不是完整URL，构建有效的URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (!UtilsService.isValidDomainOrIp(url)) {
          return {
            success: false,
            error: `Invalid domain or IP address: "${url}"`,
          };
        }
        validUrl = UtilsService.buildCookieUrl(url);
      }

      if (!validUrl) {
        return {
          success: false,
          error: `Cannot build valid URL from: "${url}"`,
        };
      }

      const cookies = await chrome.cookies.getAll({ url: validUrl });
      const validCookies = cookies.filter(cookie => cookie && cookie.name);

      return {
        success: true,
        data: validCookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expirationDate,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite as 'Strict' | 'Lax' | 'None',
        })),
      };
    } catch (error) {
      console.error('Failed to get cookies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 设置Cookie
   */
  static async setCookie(
    url: string,
    cookie: Partial<CookieData>,
  ): Promise<ChromeResponse<boolean>> {
    try {
      // 验证并构建有效的URL
      let validUrl = url;

      // 如果传入的是域名而不是完整URL，构建有效的URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (!UtilsService.isValidDomainOrIp(url)) {
          return {
            success: false,
            error: `Invalid domain or IP address: "${url}"`,
          };
        }
        validUrl = UtilsService.buildCookieUrl(url);
      }

      if (!validUrl) {
        return {
          success: false,
          error: `Cannot build valid URL from: "${url}"`,
        };
      }

      await chrome.cookies.set({
        url: validUrl,
        name: cookie.name || '',
        value: cookie.value || '',
        domain: cookie.domain,
        path: cookie.path || '/',
        expirationDate: cookie.expires,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: (cookie.sameSite?.toLowerCase() as chrome.cookies.SameSiteStatus) || 'lax',
      });

      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to set cookie:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 删除Cookie
   */
  static async removeCookie(url: string, name: string): Promise<ChromeResponse<boolean>> {
    try {
      // 验证并构建有效的URL
      let validUrl = url;

      // 如果传入的是域名而不是完整URL，构建有效的URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (!UtilsService.isValidDomainOrIp(url)) {
          return {
            success: false,
            error: `Invalid domain or IP address: "${url}"`,
          };
        }
        validUrl = UtilsService.buildCookieUrl(url);
      }

      if (!validUrl) {
        return {
          success: false,
          error: `Cannot build valid URL from: "${url}"`,
        };
      }

      await chrome.cookies.remove({ url: validUrl, name });
      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to remove cookie:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 清空所有Cookies
   */
  static async clearCookies(url: string): Promise<ChromeResponse<boolean>> {
    try {
      // 验证并构建有效的URL
      let validUrl = url;

      // 如果传入的是域名而不是完整URL，构建有效的URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (!UtilsService.isValidDomainOrIp(url)) {
          return {
            success: false,
            error: `Invalid domain or IP address: "${url}"`,
          };
        }
        validUrl = UtilsService.buildCookieUrl(url);
      }

      if (!validUrl) {
        return {
          success: false,
          error: `Cannot build valid URL from: "${url}"`,
        };
      }

      const cookies = await chrome.cookies.getAll({ url: validUrl });

      for (const cookie of cookies) {
        await chrome.cookies.remove({
          url: validUrl,
          name: cookie.name,
        });
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to clear cookies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== Chrome存储相关方法 ====================

  /**
   * 获取Chrome本地存储数据
   */
  static async getChromeStorage(keys?: string | string[] | null): Promise<ChromeResponse<Record<string, unknown>>> {
    try {
      const result = await chrome.storage.local.get(keys);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to get chrome storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 设置Chrome本地存储数据
   */
  static async setChromeStorage(items: Record<string, unknown>): Promise<ChromeResponse<boolean>> {
    try {
      await chrome.storage.local.set(items);
      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to set chrome storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 删除Chrome本地存储数据
   */
  static async removeChromeStorage(keys: string | string[]): Promise<ChromeResponse<boolean>> {
    try {
      await chrome.storage.local.remove(keys);
      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to remove chrome storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 清空Chrome本地存储
   */
  static async clearChromeStorage(): Promise<ChromeResponse<boolean>> {
    try {
      await chrome.storage.local.clear();
      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to clear chrome storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

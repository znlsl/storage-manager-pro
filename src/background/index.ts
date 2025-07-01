// Background Script
import type { ChromeMessage, ChromeResponse } from '../types/chrome.types';

class BackgroundService {
  private popupWindowId: number | null = null;
  private extensionTabIds: Set<number> = new Set();
  private triggerTabInfo: chrome.tabs.Tab | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // 监听扩展安装/更新
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));

    // 监听来自 content script 和 popup 的消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // 监听扩展图标点击
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this));

    // 监听标签页更新
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));

    // 监听标签页关闭
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));

    // 监听窗口关闭
    chrome.windows.onRemoved.addListener(this.handleWindowRemoved.bind(this));

    // 监听Cookie变化
    chrome.cookies.onChanged.addListener(this.handleCookieChanged.bind(this));

    console.log('Storage Manager Pro background script initialized');
  }

  private handleInstalled(details: chrome.runtime.InstalledDetails): void {
    console.log('Extension installed/updated:', details.reason);

    if (details.reason === 'install') {
      // 首次安装时的初始化
      this.initializeExtension();
    } else if (details.reason === 'update') {
      // 更新时的处理
      this.handleExtensionUpdate(details.previousVersion);
    }
  }

  private async initializeExtension(): Promise<void> {
    try {
      // 设置默认配置
      await chrome.storage.local.set({
        theme: 'auto',
        language: 'zh',
        windowMode: 'tab',
        windowSize: {
          width: 1000,
          height: 800,
        },
      });

      console.log('Extension initialized with default settings');
    } catch (error) {
      console.error('Failed to initialize extension:', error);
    }
  }

  private handleExtensionUpdate(previousVersion?: string): void {
    console.log('Extension updated from version:', previousVersion);
    // 这里可以处理版本迁移逻辑
  }

  private handleMessage(
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ChromeResponse) => void,
  ): boolean {
    console.log('Received message:', message.type, 'from:', sender.tab?.url);

    switch (message.type) {
      case 'GET_TABS':
        this.handleGetTabs(sendResponse);
        break;

      case 'OPEN_TAB':
        this.handleOpenTab(message.payload as { url: string }, sendResponse);
        break;

      case 'CLOSE_TAB':
        this.handleCloseTab(message.payload as { tabId: number }, sendResponse);
        break;

      case 'EXECUTE_SCRIPT':
        this.handleExecuteScript(
          message.payload as { tabId: number; code: string },
          sendResponse,
        );
        break;

      case 'GET_TRIGGER_TAB':
        this.handleGetTriggerTab(sendResponse);
        break;

      case 'STORAGE_CHANGED':
        this.handleStorageChanged(message, sender);
        sendResponse({ success: true });
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

  private async handleGetTabs(
    sendResponse: (response: ChromeResponse) => void,
  ): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      const filteredTabs = tabs
        .filter(tab => tab.url && !tab.url.startsWith('chrome://'))
        .map(tab => ({
          id: tab.id,
          url: tab.url,
          title: tab.title,
          active: tab.active,
          windowId: tab.windowId,
        }));

      sendResponse({
        success: true,
        data: filteredTabs,
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tabs',
      });
    }
  }

  private async handleOpenTab(
    payload: { url: string },
    sendResponse: (response: ChromeResponse) => void,
  ): Promise<void> {
    try {
      const tab = await chrome.tabs.create({ url: payload.url });
      sendResponse({
        success: true,
        data: {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          active: tab.active,
          windowId: tab.windowId,
        },
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open tab',
      });
    }
  }

  private async handleCloseTab(
    payload: { tabId: number },
    sendResponse: (response: ChromeResponse) => void,
  ): Promise<void> {
    try {
      await chrome.tabs.remove(payload.tabId);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close tab',
      });
    }
  }

  private async handleExecuteScript(
    payload: { tabId: number; code: string },
    sendResponse: (response: ChromeResponse) => void,
  ): Promise<void> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: payload.tabId },
        func: new Function(payload.code) as () => unknown,
      });

      sendResponse({
        success: true,
        data: results[0]?.result,
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute script',
      });
    }
  }

  private handleGetTriggerTab(
    sendResponse: (response: ChromeResponse) => void,
  ): void {
    try {
      if (this.triggerTabInfo) {
        sendResponse({
          success: true,
          data: {
            id: this.triggerTabInfo.id,
            url: this.triggerTabInfo.url,
            title: this.triggerTabInfo.title,
            active: this.triggerTabInfo.active,
            windowId: this.triggerTabInfo.windowId,
          },
        });
      } else {
        sendResponse({
          success: false,
          error: 'No trigger tab information available',
        });
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get trigger tab',
      });
    }
  }

  private async handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
    // 存储触发插件的标签页信息
    this.triggerTabInfo = tab;
    try {
      // 获取用户设置的窗口模式
      const settings = await chrome.storage.local.get(['windowMode', 'windowSize']);
      const windowMode = settings.windowMode || 'tab';
      const windowSize = settings.windowSize || { width: 1000, height: 800 };

      if (windowMode === 'popup') {
        // 弹窗模式 - 检查是否已有弹窗打开
        if (await this.focusExistingPopup()) {
          return;
        }

        // 创建新弹窗
        const window = await chrome.windows.create({
          url: chrome.runtime.getURL('tab.html'),
          type: 'popup',
          width: windowSize.width,
          height: windowSize.height,
          focused: true,
        });

        if (window.id) {
          this.popupWindowId = window.id;
        }
      } else {
        // 标签页模式 - 检查是否已有标签页打开
        if (await this.focusExistingTab()) {
          return;
        }

        // 创建新标签页
        const tab = await chrome.tabs.create({
          url: chrome.runtime.getURL('tab.html'),
          active: true,
        });

        if (tab.id) {
          this.extensionTabIds.add(tab.id);
        }
      }
    } catch (error) {
      console.error('Failed to open extension:', error);

      // 降级到标签页模式
      try {
        if (!(await this.focusExistingTab())) {
          const tab = await chrome.tabs.create({
            url: chrome.runtime.getURL('tab.html'),
            active: true,
          });

          if (tab.id) {
            this.extensionTabIds.add(tab.id);
          }
        }
      } catch (fallbackError) {
        console.error('Failed to open extension in fallback mode:', fallbackError);
      }
    }
  }

  private handleTabUpdated(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab,
  ): void {
    // 检查是否是扩展标签页
    if (changeInfo.status === 'complete' && tab.url) {
      if (tab.url.includes(chrome.runtime.getURL('tab.html'))) {
        this.extensionTabIds.add(tabId);
      }
      console.log('Tab updated:', tab.url);
    }
  }

  private handleTabRemoved(tabId: number): void {
    // 从扩展标签页集合中移除
    this.extensionTabIds.delete(tabId);
  }

  private handleWindowRemoved(windowId: number): void {
    // 如果关闭的是弹窗窗口，清理窗口ID
    if (windowId === this.popupWindowId) {
      this.popupWindowId = null;
    }
  }

  /**
   * 检查并聚焦到现有的弹窗
   */
  private async focusExistingPopup(): Promise<boolean> {
    if (!this.popupWindowId) {
      return false;
    }

    try {
      // 检查窗口是否仍然存在
      const window = await chrome.windows.get(this.popupWindowId);
      if (window) {
        // 聚焦到现有窗口
        await chrome.windows.update(this.popupWindowId, { focused: true });
        return true;
      }
    } catch (error) {
      // 窗口不存在，清理ID
      this.popupWindowId = null;
    }

    return false;
  }

  /**
   * 检查并聚焦到现有的扩展标签页
   */
  private async focusExistingTab(): Promise<boolean> {
    try {
      // 查找所有扩展标签页
      const tabs = await chrome.tabs.query({});
      const extensionUrl = chrome.runtime.getURL('tab.html');

      for (const tab of tabs) {
        if (tab.url && tab.url.includes(extensionUrl) && tab.id) {
          // 聚焦到现有标签页
          await chrome.tabs.update(tab.id, { active: true });
          if (tab.windowId) {
            await chrome.windows.update(tab.windowId, { focused: true });
          }
          this.extensionTabIds.add(tab.id);
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to focus existing tab:', error);
    }

    return false;
  }

  /**
   * 处理Cookie变化事件
   */
  private async handleCookieChanged(changeInfo: chrome.cookies.CookieChangeInfo): Promise<void> {
    try {
      console.log('Cookie changed:', {
        removed: changeInfo.removed,
        cookie: changeInfo.cookie,
        cause: changeInfo.cause,
      });

      // 通知所有扩展标签页Cookie发生了变化
      const message: ChromeMessage = {
        type: 'COOKIE_CHANGED',
        payload: {
          removed: changeInfo.removed,
          cookie: changeInfo.cookie,
          cause: changeInfo.cause,
          domain: changeInfo.cookie.domain,
        },
      };

      // 向所有扩展标签页发送消息
      for (const tabId of this.extensionTabIds) {
        try {
          await chrome.tabs.sendMessage(tabId, message);
        } catch (error) {
          // 如果标签页已关闭，从集合中移除
          console.warn(`Failed to send cookie change message to tab ${tabId}:`, error);
          this.extensionTabIds.delete(tabId);
        }
      }

      // 如果有弹窗窗口，也通知弹窗
      if (this.popupWindowId) {
        try {
          const tabs = await chrome.tabs.query({ windowId: this.popupWindowId });
          for (const tab of tabs) {
            if (tab.id) {
              await chrome.tabs.sendMessage(tab.id, message);
            }
          }
        } catch (error) {
          console.warn('Failed to send cookie change message to popup:', error);
        }
      }
    } catch (error) {
      console.error('Error handling cookie change:', error);
    }
  }

  /**
   * 处理Storage变化事件
   */
  private async handleStorageChanged(
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<void> {
    try {
      console.log('Storage changed:', message.payload);

      // 转发消息给所有扩展标签页
      for (const tabId of this.extensionTabIds) {
        try {
          await chrome.tabs.sendMessage(tabId, message);
        } catch (error) {
          // 如果标签页已关闭，从集合中移除
          console.warn(`Failed to send storage change message to tab ${tabId}:`, error);
          this.extensionTabIds.delete(tabId);
        }
      }

      // 如果有弹窗窗口，也通知弹窗
      if (this.popupWindowId) {
        try {
          const tabs = await chrome.tabs.query({ windowId: this.popupWindowId });
          for (const tab of tabs) {
            if (tab.id && tab.id !== sender.tab?.id) { // 避免发送给发送者自己
              await chrome.tabs.sendMessage(tab.id, message);
            }
          }
        } catch (error) {
          console.warn('Failed to send storage change message to popup:', error);
        }
      }
    } catch (error) {
      console.error('Error handling storage change:', error);
    }
  }
}

// 初始化 background service
new BackgroundService();

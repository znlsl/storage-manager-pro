/**
 * 扩展状态枚举
 */
export enum ExtensionState {
  UNKNOWN = 'unknown',
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  DISABLED = 'disabled'
}

/**
 * 扩展状态管理器
 * 智能检测和管理扩展的可用状态
 */
export class ExtensionStateManager {
  private static instance: ExtensionStateManager;
  private currentState: ExtensionState = ExtensionState.UNKNOWN;
  private lastCheckTime: number = 0;
  private checkInterval: number = 5000; // 5秒检查一次
  private consecutiveFailures: number = 0;
  private maxConsecutiveFailures: number = 3;
  private stateChangeCallbacks: Array<(state: ExtensionState) => void> = [];

  private constructor() {}

  static getInstance(): ExtensionStateManager {
    if (!ExtensionStateManager.instance) {
      ExtensionStateManager.instance = new ExtensionStateManager();
    }
    return ExtensionStateManager.instance;
  }

  /**
   * 获取当前扩展状态
   */
  getCurrentState(): ExtensionState {
    return this.currentState;
  }

  /**
   * 检查扩展是否可用
   */
  async checkExtensionState(): Promise<ExtensionState> {
    const now = Date.now();

    // 如果最近检查过且状态是不可用，不要频繁检查
    if (this.currentState === ExtensionState.DISABLED &&
        now - this.lastCheckTime < this.checkInterval * 2) {
      return this.currentState;
    }

    this.lastCheckTime = now;

    try {
      // 基础检查：Chrome API是否可用
      if (!this.isBasicContextValid()) {
        this.updateState(ExtensionState.UNAVAILABLE);
        return this.currentState;
      }

      // 深度检查：尝试与background script通信
      const isReachable = await this.testBackgroundCommunication();

      if (isReachable) {
        this.consecutiveFailures = 0;
        this.updateState(ExtensionState.AVAILABLE);
      } else {
        this.consecutiveFailures++;

        // 连续失败多次，认为扩展被禁用
        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          this.updateState(ExtensionState.DISABLED);
        } else {
          this.updateState(ExtensionState.UNAVAILABLE);
        }
      }
    } catch (error) {
      this.consecutiveFailures++;
      this.updateState(this.consecutiveFailures >= this.maxConsecutiveFailures ?
        ExtensionState.DISABLED : ExtensionState.UNAVAILABLE);
    }

    return this.currentState;
  }

  /**
   * 基础上下文有效性检查
   */
  private isBasicContextValid(): boolean {
    try {
      return !!(chrome?.runtime?.id && chrome?.runtime?.sendMessage);
    } catch {
      return false;
    }
  }

  /**
   * 测试与background script的通信
   */
  private async testBackgroundCommunication(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);

      try {
        chrome.runtime.sendMessage({ type: 'EXTENSION_STATE_CHECK' }, (_response) => {
          clearTimeout(timeout);
          // 即使没有响应，只要没有错误就认为是可达的
          resolve(!chrome.runtime.lastError);
        });
      } catch {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  /**
   * 更新状态并通知监听器
   */
  private updateState(newState: ExtensionState): void {
    if (this.currentState !== newState) {
      const oldState = this.currentState;
      this.currentState = newState;

      console.log(`Extension state changed: ${oldState} -> ${newState}`);

      // 通知所有监听器
      this.stateChangeCallbacks.forEach(callback => {
        try {
          callback(newState);
        } catch (error) {
          console.error('Error in state change callback:', error);
        }
      });
    }
  }

  /**
   * 添加状态变化监听器
   */
  onStateChange(callback: (state: ExtensionState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * 移除状态变化监听器
   */
  removeStateChangeListener(callback: (state: ExtensionState) => void): void {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * 强制重新检查状态
   */
  async forceCheck(): Promise<ExtensionState> {
    this.lastCheckTime = 0;
    return await this.checkExtensionState();
  }

  /**
   * 重置状态（用于恢复场景）
   */
  reset(): void {
    this.currentState = ExtensionState.UNKNOWN;
    this.consecutiveFailures = 0;
    this.lastCheckTime = 0;
  }
}

/**
 * 扩展上下文工具类
 * 处理 Chrome 扩展上下文失效相关的错误和重试逻辑
 */

export class ExtensionContextUtils {
  /**
   * 检查扩展上下文是否有效
   */
  static isExtensionContextValid(): boolean {
    try {
      // 检查 chrome.runtime 是否存在
      if (!chrome?.runtime) {
        return false;
      }

      // 检查 chrome.runtime.id 是否存在
      if (!chrome.runtime.id) {
        return false;
      }

      // 检查 chrome.runtime.onMessage 是否可用
      if (!chrome.runtime.onMessage) {
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Extension context validation failed:', error);
      return false;
    }
  }

  /**
   * 深度检查扩展上下文是否真正可用（包括通信能力）
   */
  static async isExtensionContextReallyValid(): Promise<boolean> {
    try {
      if (!this.isExtensionContextValid()) {
        return false;
      }

      // 尝试发送一个简单的ping消息来测试实际通信能力
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 1000); // 1秒超时

        try {
          chrome.runtime.sendMessage({ type: 'PING' }, (_response) => {
            clearTimeout(timeout);
            // 即使没有响应也认为是有效的，因为background可能没有处理PING
            resolve(true);
          });
        } catch (error) {
          clearTimeout(timeout);
          resolve(false);
        }
      });
    } catch (error) {
      console.warn('Deep extension context validation failed:', error);
      return false;
    }
  }

  /**
   * 检查是否是上下文失效错误
   */
  static isContextInvalidatedError(errorMessage: string): boolean {
    const contextErrors = [
      'Extension context invalidated',
      'Could not establish connection',
      'The message port closed before a response was received',
      'Receiving end does not exist',
      'Cannot access chrome',
      'chrome.runtime is not available',
    ];

    return contextErrors.some(error =>
      errorMessage.toLowerCase().includes(error.toLowerCase()),
    );
  }

  /**
   * 延迟函数
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 智能消息发送（基于扩展状态）
   */
  static async sendMessageWithRetry(
    message: any,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<any> {
    const stateManager = ExtensionStateManager.getInstance();

    // 首先检查扩展状态
    const currentState = await stateManager.checkExtensionState();

    // 如果扩展被禁用，直接抛出错误，不进行重试
    if (currentState === ExtensionState.DISABLED) {
      console.warn('Extension is disabled, skipping message send:', message.type);
      throw new Error('Extension is disabled - message sending aborted');
    }

    // 如果扩展不可用，进行有限重试
    if (currentState === ExtensionState.UNAVAILABLE) {
      console.warn('Extension is temporarily unavailable, will retry:', message.type);
      maxRetries = Math.min(maxRetries, 2); // 限制重试次数
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 再次检查基础上下文
        if (!this.isExtensionContextValid()) {
          throw new Error('Extension context invalidated');
        }

        const result = await chrome.runtime.sendMessage(message);

        // 成功发送，更新状态为可用
        if (currentState !== ExtensionState.AVAILABLE) {
          stateManager.reset();
          await stateManager.checkExtensionState();
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // 检查是否是上下文失效错误
        if (this.isContextInvalidatedError(errorMessage)) {
          console.warn(`Extension context error (attempt ${attempt}/${maxRetries})`, {
            error: errorMessage,
            message: message.type,
            url: window.location.href,
            domain: window.location.hostname,
            extensionState: currentState
          });

          // 更新扩展状态
          await stateManager.checkExtensionState();
          const newState = stateManager.getCurrentState();

          // 如果检测到扩展被禁用，立即停止重试
          if (newState === ExtensionState.DISABLED) {
            console.error('Extension detected as disabled, stopping retries');
            throw new Error('Extension is disabled - unable to communicate with background script');
          }

          if (attempt === maxRetries) {
            console.error('Max retries reached, giving up', {
              finalError: errorMessage,
              messageType: message.type,
              url: window.location.href,
              extensionState: newState
            });
            throw new Error('Extension context invalidated - unable to communicate with background script');
          }

          // 等待一段时间后重试
          await this.sleep(delay * attempt);
          continue;
        }

        // 其他错误直接抛出
        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * 带重试机制的 chrome.tabs.sendMessage
   */
  static async sendMessageToTabWithRetry<T = unknown>(
    tabId: number,
    message: any,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 检查扩展上下文是否有效
        if (!this.isExtensionContextValid()) {
          throw new Error('Extension context invalidated');
        }

        return await chrome.tabs.sendMessage(tabId, message);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // 检查是否是上下文失效错误
        if (this.isContextInvalidatedError(errorMessage)) {
          console.warn(`Extension context invalidated when sending to tab ${tabId} (attempt ${attempt}/${maxRetries})`);

          if (attempt === maxRetries) {
            console.error('Extension context permanently invalidated, giving up');
            throw new Error('Extension context invalidated - unable to communicate with tab');
          }

          // 等待一段时间后重试
          await this.sleep(delay * attempt);
          continue;
        }

        // 其他错误直接抛出
        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * 安全执行 Chrome API 调用
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    operationName: string = 'Chrome API operation',
  ): Promise<T> {
    try {
      if (!this.isExtensionContextValid()) {
        console.warn(`${operationName}: Extension context invalid, returning fallback value`);
        return fallbackValue;
      }

      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (this.isContextInvalidatedError(errorMessage)) {
        console.warn(`${operationName}: Extension context invalidated, returning fallback value`);
        return fallbackValue;
      }

      // 重新抛出其他错误
      throw error;
    }
  }

  /**
   * 检查并显示上下文失效警告
   */
  static checkContextAndWarn(): boolean {
    if (!this.isExtensionContextValid()) {
      console.warn('Extension context is invalid. This usually happens when the extension is reloaded or updated. Please refresh the page or restart the extension.');
      return false;
    }
    return true;
  }

  /**
   * 创建上下文失效错误
   */
  static createContextInvalidatedError(operation: string): Error {
    return new Error(`Extension context invalidated during ${operation}. Please refresh the page or restart the extension.`);
  }
}

export default ExtensionContextUtils;

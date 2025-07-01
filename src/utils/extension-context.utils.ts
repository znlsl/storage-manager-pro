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
      // 尝试访问 chrome.runtime.id
      return !!chrome.runtime?.id;
    } catch {
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
   * 带重试机制的 chrome.runtime.sendMessage
   */
  static async sendMessageWithRetry(
    message: any,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 检查扩展上下文是否有效
        if (!this.isExtensionContextValid()) {
          throw new Error('Extension context invalidated');
        }

        return await chrome.runtime.sendMessage(message);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // 检查是否是上下文失效错误
        if (this.isContextInvalidatedError(errorMessage)) {
          console.warn(`Extension context invalidated (attempt ${attempt}/${maxRetries})`);

          if (attempt === maxRetries) {
            console.error('Extension context permanently invalidated, giving up');
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

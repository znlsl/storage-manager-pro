// 国际化服务
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Language } from '../types/common.types';

// 导入语言资源
import zhTranslations from '../locales/zh.json';
import enTranslations from '../locales/en.json';

export class I18nService {
  private static initialized = false;

  /**
   * 初始化国际化
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await i18n
      .use(initReactI18next)
      .init({
        resources: {
          zh: {
            translation: zhTranslations,
          },
          en: {
            translation: enTranslations,
          },
        },
        lng: await this.getStoredLanguage(),
        fallbackLng: 'zh',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });

    this.initialized = true;
  }

  /**
   * 获取当前语言
   */
  static getCurrentLanguage(): Language {
    return (i18n.language as Language) || 'zh';
  }

  /**
   * 设置语言
   */
  static async setLanguage(language: Language): Promise<void> {
    await i18n.changeLanguage(language);
    await this.storeLanguage(language);
  }

  /**
   * 获取翻译文本
   */
  static translate(key: string, options?: Record<string, unknown>): string {
    return i18n.t(key, options);
  }

  /**
   * 获取支持的语言列表
   */
  static getSupportedLanguages(): Language[] {
    return ['zh', 'en'];
  }

  /**
   * 检查是否支持指定语言
   */
  static isLanguageSupported(language: string): language is Language {
    return this.getSupportedLanguages().includes(language as Language);
  }

  /**
   * 获取语言显示名称
   */
  static getLanguageDisplayName(language: Language): string {
    const names: Record<Language, string> = {
      zh: '中文',
      en: 'English',
    };
    return names[language] || language;
  }

  /**
   * 从存储中获取语言设置（兼容原版的多种存储方式）
   */
  private static async getStoredLanguage(): Promise<Language> {
    try {
      console.log('I18nService.getStoredLanguage: 从storage获取语言设置');
      // 先从存储中获取已保存的语言设置，检查两个位置
      const result = await chrome.storage.local.get(['language', 'settings']);

      console.log('I18nService.getStoredLanguage: 获取结果', result);

      let savedLanguage: string | null = null;

      // 优先使用settings中的语言设置
      if (result.settings && result.settings.language) {
        savedLanguage = result.settings.language;
        console.log('I18nService.getStoredLanguage: 从settings获取语言设置', savedLanguage);
      } else if (result.language) {
        savedLanguage = result.language;
        console.log('I18nService.getStoredLanguage: 从language键获取语言设置', savedLanguage);
      }

      if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
        console.log('I18nService.getStoredLanguage: 使用已保存的语言设置', savedLanguage);
        return savedLanguage;
      }

      // 如果没有存储的语言，尝试检测浏览器语言
      const browserLanguage = this.detectBrowserLanguage();
      console.log('I18nService.getStoredLanguage: 使用浏览器默认语言设置', browserLanguage);

      // 保存默认语言设置
      await this.storeLanguage(browserLanguage);

      return browserLanguage;
    } catch (error) {
      console.error('Failed to get stored language:', error);
      return 'zh';
    }
  }

  /**
   * 存储语言设置（兼容原版的存储方式）
   */
  private static async storeLanguage(language: Language): Promise<void> {
    try {
      console.log(`I18nService.storeLanguage: 保存语言设置 ${language} 到 chrome.storage.local`);
      await chrome.storage.local.set({ language });

      // 验证保存是否成功
      const result = await chrome.storage.local.get(['language']);
      console.log('I18nService.storeLanguage: 验证保存结果:', result);

      if (!result.language || result.language !== language) {
        console.error(`I18nService.storeLanguage: 保存验证失败，期望 ${language}，实际 ${result.language || '未定义'}`);
      }
    } catch (error) {
      console.error('I18nService.storeLanguage: 保存语言设置到storage失败:', error);
      throw error;
    }
  }

  /**
   * 检测浏览器语言
   */
  private static detectBrowserLanguage(): Language {
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'zh';

    // 简单的语言检测逻辑
    if (browserLanguage.startsWith('en')) {
      return 'en';
    } else if (browserLanguage.startsWith('zh')) {
      return 'zh';
    }

    return 'zh'; // 默认中文
  }

  /**
   * 监听语言变化
   */
  static onLanguageChange(callback: (language: Language) => void): () => void {
    const handler = (lng: string) => {
      if (this.isLanguageSupported(lng)) {
        callback(lng);
      }
    };

    i18n.on('languageChanged', handler);

    // 返回取消监听的函数
    return () => {
      i18n.off('languageChanged', handler);
    };
  }

  /**
   * 格式化带参数的翻译文本
   */
  static formatMessage(key: string, params: Record<string, string | number>): string {
    return this.translate(key, params);
  }

  /**
   * 获取复数形式的翻译
   */
  static translatePlural(
    key: string,
    count: number,
    options?: Record<string, unknown>,
  ): string {
    return i18n.t(key, { count, ...options });
  }

  /**
   * 检查翻译键是否存在
   */
  static hasTranslation(key: string, language?: Language): boolean {
    const lng = language || this.getCurrentLanguage();
    return i18n.exists(key, { lng });
  }

  /**
   * 获取所有翻译键
   */
  static getAllTranslationKeys(language?: Language): string[] {
    const lng = language || this.getCurrentLanguage();
    const store = i18n.getResourceBundle(lng, 'translation');

    if (!store) {
      return [];
    }

    const keys: string[] = [];
    const extractKeys = (obj: Record<string, unknown>, prefix = ''): void => {
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
          extractKeys(value as Record<string, unknown>, fullKey);
        } else {
          keys.push(fullKey);
        }
      });
    };

    extractKeys(store);
    return keys;
  }

  /**
   * 重新加载语言资源
   */
  static async reloadResources(): Promise<void> {
    await i18n.reloadResources();
  }

  /**
   * 获取当前语言的方向（LTR/RTL）
   */
  static getLanguageDirection(_language?: Language): 'ltr' | 'rtl' {
    // 目前支持的语言都是从左到右
    return 'ltr';
  }

  /**
   * 翻译页面中的所有元素（兼容原版的DOM翻译方式）
   */
  static translatePage(): void {
    // 翻译所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        element.textContent = this.translate(key);
      }
    });

    // 翻译所有带有 data-i18n-placeholder 属性的 input 元素的 placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (key && element instanceof HTMLInputElement) {
        element.placeholder = this.translate(key);
      }
    });

    // 翻译所有带有 data-i18n-title 属性的元素的 title
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      if (key && element instanceof HTMLElement) {
        element.title = this.translate(key);
      }
    });
  }

  /**
   * 获取翻译文本（兼容原版的getText方法）
   */
  static getText(key: string): string {
    return this.translate(key);
  }

  /**
   * 设置语言并保存到设置中（兼容原版的设置保存方式）
   */
  static async setLanguageWithSettings(language: Language): Promise<boolean> {
    try {
      if (!this.isLanguageSupported(language)) {
        console.error(`I18nService.setLanguageWithSettings: 不支持的语言 ${language}`);
        return false;
      }

      console.log(`I18nService.setLanguageWithSettings: 设置语言为 ${language}`);

      // 更新i18next语言
      await i18n.changeLanguage(language);

      // 保存到language键
      await this.storeLanguage(language);

      // 同时保存到settings中以保持兼容性
      try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        settings.language = language;
        await chrome.storage.local.set({ settings });
      } catch (error) {
        console.warn('Failed to save language to settings:', error);
      }

      return true;
    } catch (error) {
      console.error('I18nService.setLanguageWithSettings: 设置语言失败:', error);
      return false;
    }
  }

  /**
   * 初始化语言（兼容原版的初始化方式）
   */
  static async initializeLanguage(): Promise<Language> {
    try {
      if (this.initialized) {
        return this.getCurrentLanguage();
      }

      const language = await this.getStoredLanguage();
      await this.initialize();

      // 验证语言设置是否保存成功
      const verifyResult = await chrome.storage.local.get(['language']);
      console.log('I18nService.initializeLanguage: 验证语言设置', verifyResult);

      return language;
    } catch (error) {
      console.error('I18nService.initializeLanguage: 初始化语言出错', error);
      // 默认使用中文
      return 'zh';
    }
  }
}

// 导出 i18n 实例供 React 组件使用
export { i18n };
export default I18nService;

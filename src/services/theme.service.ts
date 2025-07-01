// 主题管理服务
import type { ThemeMode } from '../types/common.types';

export class ThemeService {
  private static listeners: Set<(theme: ThemeMode) => void> = new Set();
  private static currentTheme: ThemeMode = 'light';
  private static systemThemeMediaQuery: MediaQueryList | null = null;
  private static systemThemeChangeHandler: (() => void) | null = null;

  /**
   * 初始化主题服务
   */
  static async initialize(): Promise<void> {
    // 获取存储的主题设置
    const storedTheme = await this.getStoredTheme();
    this.currentTheme = storedTheme;

    // 设置系统主题监听
    this.setupSystemThemeListener();

    // 应用主题
    this.applyTheme(this.currentTheme);
  }

  /**
   * 获取当前主题
   */
  static getCurrentTheme(): ThemeMode {
    return this.currentTheme;
  }

  /**
   * 设置主题
   */
  static async setTheme(theme: ThemeMode): Promise<void> {
    this.currentTheme = theme;
    await this.storeTheme(theme);
    this.applyTheme(theme);
    this.notifyListeners(theme);
  }

  /**
   * 获取系统主题
   */
  static getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  /**
   * 获取实际应用的主题（处理 auto 模式）
   */
  static getEffectiveTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'auto') {
      return this.getSystemTheme();
    }
    return this.currentTheme;
  }


  /**
   * 监听主题变化
   */
  static onThemeChange(callback: (theme: ThemeMode) => void): () => void {
    this.listeners.add(callback);

    // 返回取消监听的函数
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 获取主题显示名称
   */
  static getThemeDisplayName(theme: ThemeMode): string {
    const names: Record<ThemeMode, string> = {
      light: '明亮模式',
      dark: '暗黑模式',
      auto: '自动跟随系统',
    };
    return names[theme] || theme;
  }

  /**
   * 获取支持的主题列表
   */
  static getSupportedThemes(): ThemeMode[] {
    return ['light', 'dark', 'auto'];
  }

  /**
   * 检查是否为有效主题
   */
  static isValidTheme(theme: string): theme is ThemeMode {
    return this.getSupportedThemes().includes(theme as ThemeMode);
  }

  /**
   * 从存储中获取主题设置（兼容原版的存储方式）
   */
  private static async getStoredTheme(): Promise<ThemeMode> {
    try {
      // 优先从settings中获取主题设置
      const result = await chrome.storage.local.get(['settings', 'theme']);

      let storedTheme: string | undefined;

      if (result.settings && result.settings.theme) {
        storedTheme = result.settings.theme;
      } else if (result.theme) {
        storedTheme = result.theme;
      }

      if (storedTheme && this.isValidTheme(storedTheme)) {
        return storedTheme;
      }

      return 'light'; // 默认明亮模式（与原版一致）
    } catch (error) {
      console.error('Failed to get stored theme:', error);
      return 'light';
    }
  }

  /**
   * 存储主题设置（兼容原版的存储方式）
   */
  private static async storeTheme(theme: ThemeMode): Promise<void> {
    try {
      // 保存主题设置到settings中
      const result = await chrome.storage.local.get(['settings']);
      const settings = result.settings || {};
      settings.theme = theme;
      await chrome.storage.local.set({ settings });
    } catch (error) {
      console.error('Failed to store theme:', error);
    }
  }

  /**
   * 应用主题到 DOM（兼容原版的应用方式）
   */
  private static applyTheme(theme: ThemeMode): void {
    if (typeof document === 'undefined') {
      return;
    }

    const body = document.body;

    // 移除所有主题类
    body.classList.remove('theme-light', 'theme-dark');

    if (theme === 'auto') {
      // 自动跟随系统，直接应用对应的主题类
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      // 直接应用指定主题
      body.classList.add(`theme-${theme}`);
    }

    // 更新 meta theme-color
    const effectiveTheme = this.getEffectiveTheme();
    this.updateMetaThemeColor(effectiveTheme);
  }

  /**
   * 更新 meta theme-color
   */
  private static updateMetaThemeColor(theme: 'light' | 'dark'): void {
    if (typeof document === 'undefined') {
      return;
    }

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    const colors = {
      light: '#ffffff',
      dark: '#1a1a1a',
    };

    metaThemeColor.setAttribute('content', colors[theme]);
  }

  /**
   * 设置系统主题监听
   */
  private static setupSystemThemeListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    this.systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    this.systemThemeChangeHandler = () => {
      if (this.currentTheme === 'auto') {
        this.applyTheme('auto');
        this.notifyListeners('auto');
      }
    };

    // 现代浏览器使用 addEventListener
    if (this.systemThemeMediaQuery.addEventListener) {
      this.systemThemeMediaQuery.addEventListener('change', this.systemThemeChangeHandler);
    } else {
      // 兼容旧浏览器
      this.systemThemeMediaQuery.addListener(this.systemThemeChangeHandler);
    }
  }

  /**
   * 通知所有监听器
   */
  private static notifyListeners(theme: ThemeMode): void {
    this.listeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
  }

  /**
   * 获取主题相关的 CSS 变量
   */
  static getThemeVariables(theme?: 'light' | 'dark'): Record<string, string> {
    const effectiveTheme = theme || this.getEffectiveTheme();

    const lightTheme = {
      '--color-primary': '#2563eb',
      '--color-primary-hover': '#1d4ed8',
      '--color-background': '#ffffff',
      '--color-surface': '#f8fafc',
      '--color-border': '#e2e8f0',
      '--color-text': '#1e293b',
      '--color-text-secondary': '#64748b',
      '--color-success': '#10b981',
      '--color-warning': '#f59e0b',
      '--color-error': '#ef4444',
    };

    const darkTheme = {
      '--color-primary': '#3b82f6',
      '--color-primary-hover': '#2563eb',
      '--color-background': '#0f172a',
      '--color-surface': '#1e293b',
      '--color-border': '#334155',
      '--color-text': '#f1f5f9',
      '--color-text-secondary': '#94a3b8',
      '--color-success': '#10b981',
      '--color-warning': '#f59e0b',
      '--color-error': '#ef4444',
    };

    return effectiveTheme === 'dark' ? darkTheme : lightTheme;
  }

  /**
   * 更新主题显示（兼容原版的显示更新方式）
   */
  static updateThemeDisplay(): void {
    const themeText = document.getElementById('themeText');
    if (themeText) {
      const currentTheme = this.getCurrentTheme();
      const themeNames = {
        'light': 'Light',
        'dark': 'Dark',
        'auto': 'Auto',
      };
      themeText.textContent = themeNames[currentTheme] || 'Light';
    }
  }

  /**
   * 初始化主题（兼容原版的初始化方式）
   */
  static async initializeTheme(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['settings']);
      const settings = result.settings || {};
      const savedTheme = settings.theme || 'light';

      this.currentTheme = this.isValidTheme(savedTheme) ? savedTheme : 'light';
      this.applyTheme(this.currentTheme);
      this.updateThemeDisplay();

      // 监听系统主题变化
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
          if (this.currentTheme === 'auto') {
            this.applyTheme('auto');
          }
        };

        // 使用现代API或兼容旧API
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleChange);
        } else {
          mediaQuery.addListener(handleChange);
        }

        this.systemThemeMediaQuery = mediaQuery;
      }
    } catch (error) {
      console.warn('初始化主题失败:', error);
      this.currentTheme = 'light';
      this.applyTheme('light');
      this.updateThemeDisplay();
    }
  }

  /**
   * 设置主题并更新显示（兼容原版的设置方式）
   */
  static async setThemeWithDisplay(theme: ThemeMode): Promise<void> {
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.updateThemeDisplay();

    // 保存主题设置
    try {
      const result = await chrome.storage.local.get(['settings']);
      const settings = result.settings || {};
      settings.theme = theme;
      await chrome.storage.local.set({ settings });
    } catch (error) {
      console.warn('保存主题设置失败:', error);
    }

    this.notifyListeners(theme);
  }

  /**
   * 切换主题（兼容原版的切换方式）
   */
  static async toggleTheme(): Promise<void> {
    const themes: ThemeMode[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    await this.setThemeWithDisplay(themes[nextIndex]);
  }

  /**
   * 清理资源
   */
  static cleanup(): void {
    this.listeners.clear();

    if (this.systemThemeMediaQuery && this.systemThemeChangeHandler) {
      // 移除系统主题监听器
      if (this.systemThemeMediaQuery.removeEventListener) {
        this.systemThemeMediaQuery.removeEventListener('change', this.systemThemeChangeHandler);
      } else {
        this.systemThemeMediaQuery.removeListener(this.systemThemeChangeHandler);
      }
      this.systemThemeMediaQuery = null;
      this.systemThemeChangeHandler = null;
    }
  }
}

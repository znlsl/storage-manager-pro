// 应用初始化服务
import { I18nService } from './i18n.service';
import { ThemeService } from './theme.service';

export class AppService {
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * 初始化应用所有服务
   */
  static async initialize(): Promise<void> {
    // 如果已经在初始化中，返回现有的 Promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // 如果已经初始化完成，直接返回
    if (this.initialized) {
      return Promise.resolve();
    }

    // 创建初始化 Promise
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
      this.initialized = true;
    } catch (error) {
      // 如果初始化失败，重置状态以允许重试
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * 执行实际的初始化工作
   */
  private static async performInitialization(): Promise<void> {
    console.log('Starting app initialization...');

    try {
      // 并行初始化所有服务
      await Promise.all([
        this.initializeI18n(),
        this.initializeTheme(),
      ]);

      console.log('App initialization completed successfully');
    } catch (error) {
      console.error('App initialization failed:', error);
      throw error;
    }
  }

  /**
   * 初始化国际化服务
   */
  private static async initializeI18n(): Promise<void> {
    try {
      console.log('Initializing i18n service...');
      await I18nService.initialize();
      console.log('i18n service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize i18n service:', error);
      throw new Error(`i18n initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 初始化主题服务
   */
  private static async initializeTheme(): Promise<void> {
    try {
      console.log('Initializing theme service...');
      await ThemeService.initialize();
      console.log('Theme service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize theme service:', error);
      throw new Error(`Theme initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查应用是否已初始化
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 重置初始化状态（用于测试或重新初始化）
   */
  static reset(): void {
    this.initialized = false;
    this.initializationPromise = null;
  }

  /**
   * 获取应用信息
   */
  static getAppInfo(): {
    name: string;
    version: string;
    initialized: boolean;
    services: {
      i18n: boolean;
      theme: boolean;
    };
    } {
    return {
      name: 'Storage Manager Pro',
      version: '2.0.0',
      initialized: this.initialized,
      services: {
        i18n: this.initialized,
        theme: this.initialized,
      },
    };
  }

  /**
   * 健康检查 - 验证所有服务是否正常工作
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    services: {
      i18n: 'ok' | 'error';
      theme: 'ok' | 'error';
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    const services = {
      i18n: 'ok' as 'ok' | 'error',
      theme: 'ok' as 'ok' | 'error',
    };

    // 检查 i18n 服务
    try {
      const currentLang = I18nService.getCurrentLanguage();
      const testTranslation = I18nService.translate('app_name');
      if (!currentLang || !testTranslation) {
        throw new Error('i18n service not working properly');
      }
    } catch (error) {
      services.i18n = 'error';
      errors.push(`i18n: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 检查主题服务
    try {
      const currentTheme = ThemeService.getCurrentTheme();
      const effectiveTheme = ThemeService.getEffectiveTheme();
      if (!currentTheme || !effectiveTheme) {
        throw new Error('Theme service not working properly');
      }
    } catch (error) {
      services.theme = 'error';
      errors.push(`theme: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      status: errors.length === 0 ? 'healthy' : 'unhealthy',
      services,
      errors,
    };
  }
}

export default AppService;

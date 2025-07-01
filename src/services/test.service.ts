// 服务集成测试
import { ChromeService } from './chrome.service';
import { StorageService } from './storage.service';
import { ProfileManager, LocalStorageBackupManager, CookieAccountManager } from './profile.service';
import { I18nService } from './i18n.service';
import { ThemeService } from './theme.service';
import { UtilsService } from './utils.service';

export interface TestResult {
  service: string;
  method: string;
  success: boolean;
  error?: string;
  duration: number;
}

export class TestService {
  private static results: TestResult[] = [];

  /**
   * 运行所有服务测试
   */
  static async runAllTests(): Promise<TestResult[]> {
    console.log('开始运行服务集成测试...');
    this.results = [];

    // 测试Chrome服务
    await this.testChromeService();

    // 测试存储服务
    await this.testStorageService();

    // 测试配置文件服务
    await this.testProfileService();

    // 测试国际化服务
    await this.testI18nService();

    // 测试主题服务
    await this.testThemeService();

    // 测试工具服务
    await this.testUtilsService();

    console.log('服务集成测试完成');
    return this.results;
  }

  /**
   * 测试Chrome服务
   */
  private static async testChromeService(): Promise<void> {
    console.log('测试Chrome服务...');

    // 测试获取所有标签页
    await this.runTest('ChromeService', 'getAllTabs', async () => {
      const tabs = await ChromeService.getAllTabs();
      if (!Array.isArray(tabs)) {
        throw new Error('getAllTabs should return an array');
      }
    });

    // 测试获取当前活动标签页
    await this.runTest('ChromeService', 'getActiveTab', async () => {
      await ChromeService.getActiveTab();
      // tab可能为null，这是正常的
    });

    // 测试获取域名列表
    await this.runTest('ChromeService', 'getDomainList', async () => {
      const domains = await ChromeService.getDomainList();
      if (!Array.isArray(domains)) {
        throw new Error('getDomainList should return an array');
      }
    });

    // 测试URL验证
    await this.runTest('ChromeService', 'isValidDomainUrl', async () => {
      const validUrl = ChromeService.isValidDomainUrl('https://example.com');
      const invalidUrl = ChromeService.isValidDomainUrl('chrome://settings');

      if (!validUrl || invalidUrl) {
        throw new Error('URL validation failed');
      }
    });

    // 测试Chrome存储
    await this.runTest('ChromeService', 'getChromeStorage', async () => {
      const result = await ChromeService.getChromeStorage(['test']);
      if (!result.success) {
        throw new Error('getChromeStorage failed');
      }
    });
  }

  /**
   * 测试存储服务
   */
  private static async testStorageService(): Promise<void> {
    console.log('测试存储服务...');

    // 测试获取localStorage
    await this.runTest('StorageService', 'getLocalStorage', async () => {
      const items = await StorageService.getLocalStorage();
      if (!Array.isArray(items)) {
        throw new Error('getLocalStorage should return an array');
      }
    });

    // 测试获取sessionStorage
    await this.runTest('StorageService', 'getSessionStorage', async () => {
      const items = await StorageService.getSessionStorage();
      if (!Array.isArray(items)) {
        throw new Error('getSessionStorage should return an array');
      }
    });

    // 注意：Cookie和IndexedDB相关方法已移至专门的服务类
    // 这些测试已不再适用于StorageService
  }

  /**
   * 测试配置文件服务
   */
  private static async testProfileService(): Promise<void> {
    console.log('测试配置文件服务...');

    // 测试ProfileManager
    await this.runTest('ProfileManager', 'getProfiles', async () => {
      const profiles = await ProfileManager.getProfiles();
      if (typeof profiles !== 'object') {
        throw new Error('getProfiles should return an object');
      }
    });

    await this.runTest('ProfileManager', 'getProfileList', async () => {
      const list = await ProfileManager.getProfileList();
      if (!Array.isArray(list)) {
        throw new Error('getProfileList should return an array');
      }
    });

    // 测试LocalStorageBackupManager
    await this.runTest('LocalStorageBackupManager', 'getBackups', async () => {
      const backups = await LocalStorageBackupManager.getBackups();
      if (typeof backups !== 'object') {
        throw new Error('getBackups should return an object');
      }
    });

    // 测试CookieAccountManager
    await this.runTest('CookieAccountManager', 'getAccounts', async () => {
      const accounts = await CookieAccountManager.getAccounts();
      if (typeof accounts !== 'object') {
        throw new Error('getAccounts should return an object');
      }
    });
  }

  /**
   * 测试国际化服务
   */
  private static async testI18nService(): Promise<void> {
    console.log('测试国际化服务...');

    // 测试初始化
    await this.runTest('I18nService', 'initialize', async () => {
      await I18nService.initialize();
    });

    // 测试获取当前语言
    await this.runTest('I18nService', 'getCurrentLanguage', async () => {
      const language = I18nService.getCurrentLanguage();
      if (!['zh', 'en'].includes(language)) {
        throw new Error('Invalid language returned');
      }
    });

    // 测试翻译
    await this.runTest('I18nService', 'translate', async () => {
      const text = I18nService.translate('title');
      if (typeof text !== 'string') {
        throw new Error('translate should return a string');
      }
    });

    // 测试语言支持检查
    await this.runTest('I18nService', 'isLanguageSupported', async () => {
      const supported = I18nService.isLanguageSupported('zh');
      const unsupported = I18nService.isLanguageSupported('fr');

      if (!supported || unsupported) {
        throw new Error('Language support check failed');
      }
    });

    // 测试获取支持的语言
    await this.runTest('I18nService', 'getSupportedLanguages', async () => {
      const languages = I18nService.getSupportedLanguages();
      if (!Array.isArray(languages) || languages.length === 0) {
        throw new Error('getSupportedLanguages should return a non-empty array');
      }
    });
  }

  /**
   * 测试主题服务
   */
  private static async testThemeService(): Promise<void> {
    console.log('测试主题服务...');

    // 测试初始化
    await this.runTest('ThemeService', 'initialize', async () => {
      await ThemeService.initialize();
    });

    // 测试获取当前主题
    await this.runTest('ThemeService', 'getCurrentTheme', async () => {
      const theme = ThemeService.getCurrentTheme();
      if (!['light', 'dark', 'auto'].includes(theme)) {
        throw new Error('Invalid theme returned');
      }
    });

    // 测试获取系统主题
    await this.runTest('ThemeService', 'getSystemTheme', async () => {
      const systemTheme = ThemeService.getSystemTheme();
      if (!['light', 'dark'].includes(systemTheme)) {
        throw new Error('Invalid system theme returned');
      }
    });

    // 测试获取有效主题
    await this.runTest('ThemeService', 'getEffectiveTheme', async () => {
      const effectiveTheme = ThemeService.getEffectiveTheme();
      if (!['light', 'dark'].includes(effectiveTheme)) {
        throw new Error('Invalid effective theme returned');
      }
    });

    // 测试主题验证
    await this.runTest('ThemeService', 'isValidTheme', async () => {
      const valid = ThemeService.isValidTheme('light');
      const invalid = ThemeService.isValidTheme('invalid');

      if (!valid || invalid) {
        throw new Error('Theme validation failed');
      }
    });

    // 测试获取支持的主题
    await this.runTest('ThemeService', 'getSupportedThemes', async () => {
      const themes = ThemeService.getSupportedThemes();
      if (!Array.isArray(themes) || themes.length === 0) {
        throw new Error('getSupportedThemes should return a non-empty array');
      }
    });
  }

  /**
   * 测试工具服务
   */
  private static async testUtilsService(): Promise<void> {
    console.log('测试工具服务...');

    // 测试JSON格式化
    await this.runTest('UtilsService', 'formatJSON', async () => {
      const formatted = UtilsService.formatJSON('{"test": "value"}');
      if (!formatted.includes('\n')) {
        throw new Error('JSON should be formatted with newlines');
      }
    });

    // 测试JSON压缩
    await this.runTest('UtilsService', 'minifyJSON', async () => {
      const minified = UtilsService.minifyJSON('{\n  "test": "value"\n}');
      if (minified.includes('\n')) {
        throw new Error('JSON should be minified without newlines');
      }
    });

    // 测试Base64编码解码
    await this.runTest('UtilsService', 'base64Encode/Decode', async () => {
      const original = 'Hello, World!';
      const encoded = UtilsService.encodeBase64(original);
      const decoded = UtilsService.decodeBase64(encoded);

      if (decoded !== original) {
        throw new Error('Base64 encode/decode failed');
      }
    });

    // 测试UTF-8编码解码
    await this.runTest('UtilsService', 'utf8Encode/Decode', async () => {
      const original = '你好，世界！';
      const encoded = UtilsService.encodeUTF8(original);
      const decoded = UtilsService.decodeUTF8(encoded);

      if (decoded !== original) {
        throw new Error('UTF-8 encode/decode failed');
      }
    });

    // 测试域名验证
    await this.runTest('UtilsService', 'isValidDomainUrl', async () => {
      const valid = UtilsService.isValidDomainUrl('https://example.com');
      const invalid = UtilsService.isValidDomainUrl('chrome://settings');

      if (!valid || invalid) {
        throw new Error('Domain URL validation failed');
      }
    });

    // 测试顶级域名提取
    await this.runTest('UtilsService', 'extractTopLevelDomain', async () => {
      const domain = UtilsService.extractTopLevelDomain('sub.example.com');
      if (domain !== 'example.com') {
        throw new Error('Top level domain extraction failed');
      }
    });

    // 测试JSON验证
    await this.runTest('UtilsService', 'isValidJSON', async () => {
      const valid = UtilsService.isValidJSON('{"test": "value"}');
      const invalid = UtilsService.isValidJSON('{invalid json}');

      if (!valid || invalid) {
        throw new Error('JSON validation failed');
      }
    });
  }

  /**
   * 运行单个测试
   */
  private static async runTest(
    service: string,
    method: string,
    testFn: () => Promise<void>,
  ): Promise<void> {
    const startTime = performance.now();

    try {
      await testFn();
      const duration = performance.now() - startTime;

      this.results.push({
        service,
        method,
        success: true,
        duration,
      });

      console.log(`✅ ${service}.${method} - ${duration.toFixed(2)}ms`);
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.results.push({
        service,
        method,
        success: false,
        error: errorMessage,
        duration,
      });

      console.error(`❌ ${service}.${method} - ${errorMessage} - ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * 获取测试结果摘要
   */
  static getTestSummary(): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    totalDuration: number;
    } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      passRate,
      totalDuration,
    };
  }

  /**
   * 获取失败的测试
   */
  static getFailedTests(): TestResult[] {
    return this.results.filter(r => !r.success);
  }

  /**
   * 打印测试报告
   */
  static printTestReport(): void {
    const summary = this.getTestSummary();
    const failedTests = this.getFailedTests();

    console.log('\n=== 服务集成测试报告 ===');
    console.log(`总测试数: ${summary.total}`);
    console.log(`通过: ${summary.passed}`);
    console.log(`失败: ${summary.failed}`);
    console.log(`通过率: ${summary.passRate.toFixed(2)}%`);
    console.log(`总耗时: ${summary.totalDuration.toFixed(2)}ms`);

    if (failedTests.length > 0) {
      console.log('\n失败的测试:');
      failedTests.forEach(test => {
        console.log(`❌ ${test.service}.${test.method}: ${test.error}`);
      });
    }

    console.log('\n=== 测试报告结束 ===\n');
  }
}

// 配置文件管理服务
import { ChromeService } from './chrome.service';

// Cookie 数据接口
export interface CookieData {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

// 单个域名的数据接口
export interface DomainData {
  domain: string;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: CookieData[];
  timestamp: number;
}

// 全局配置文件数据接口
export interface GlobalProfileData {
  domains: Record<string, DomainData>; // 按域名组织的数据
  accounts: Record<string, AccountData>; // 账户数据
  backups: Record<string, BackupData>; // 备份数据
  metadata: {
    version: string;
    createdAt: number;
    updatedAt: number;
    totalDomains: number;
    totalAccounts: number;
    totalBackups: number;
  };
}

// 配置文件接口（重构后）
export interface Profile {
  name: string;
  description?: string;
  data: GlobalProfileData;
  timestamp: number;
  version: string;
}


// 备份数据接口（重构后）
export interface BackupData {
  id: string;
  name: string;
  description: string;
  domain: string;
  data: Record<string, string>;
  timestamp: number;
  itemCount: number;
  type: 'localStorage' | 'sessionStorage';
}

// 账户数据接口（重构后）
export interface AccountData {
  id: string;
  name: string;
  description: string;
  cookies: CookieData[];
  timestamp: number;
  cookieCount: number;
  domain: string; // 顶级域名
  originalDomain: string;
  domains: string[]; // 支持多域名
}

/**
 * 配置文件管理器
 */
export class ProfileManager {
  private static readonly STORAGE_KEY = 'profiles';
  private static readonly CURRENT_PROFILE_KEY = 'currentProfileName';
  static readonly GLOBAL_PROFILES_KEY = 'globalProfiles';
  static readonly CURRENT_VERSION = '2.0.0';

  /**
   * 获取所有配置文件
   */
  static async getProfiles(): Promise<Record<string, Profile>> {
    try {
      const response = await ChromeService.getChromeStorage([this.STORAGE_KEY]);
      if (response.success && response.data) {
        return (response.data[this.STORAGE_KEY] as Record<string, Profile>) || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to get profiles:', error);
      return {};
    }
  }

  /**
   * 获取当前配置文件名称
   */
  static async getCurrentProfileName(): Promise<string | null> {
    try {
      const response = await ChromeService.getChromeStorage([this.CURRENT_PROFILE_KEY]);
      if (response.success && response.data) {
        return (response.data[this.CURRENT_PROFILE_KEY] as string) || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get current profile name:', error);
      return null;
    }
  }

  /**
   * 保存配置文件
   */
  static async saveProfile(name: string, data: GlobalProfileData, overwrite = false): Promise<boolean> {
    try {
      const profiles = await this.getProfiles();

      // 如果已存在且未选择覆盖，返回false
      if (profiles[name] && !overwrite) {
        return false;
      }

      // 确保数据是GlobalProfileData格式
      const globalData: GlobalProfileData = data;

      profiles[name] = {
        name,
        data: globalData,
        timestamp: Date.now(),
        version: this.CURRENT_VERSION,
      };

      // 保存配置文件
      const saveResponse = await ChromeService.setChromeStorage({
        [this.STORAGE_KEY]: profiles,
        [this.CURRENT_PROFILE_KEY]: name,
      });

      return saveResponse.success;
    } catch (error) {
      console.error('Failed to save profile:', error);
      return false;
    }
  }

  /**
   * 加载配置文件
   */
  static async loadProfile(name: string): Promise<Profile | null> {
    try {
      const profiles = await this.getProfiles();
      const profile = profiles[name];

      if (profile) {
        // 更新当前配置名称
        await ChromeService.setChromeStorage({
          [this.CURRENT_PROFILE_KEY]: name,
        });
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Failed to load profile:', error);
      return null;
    }
  }

  /**
   * 删除配置文件
   */
  static async deleteProfile(name: string): Promise<boolean> {
    try {
      const profiles = await this.getProfiles();
      const currentProfileName = await this.getCurrentProfileName();

      delete profiles[name];

      const updateData: Record<string, unknown> = {
        [this.STORAGE_KEY]: profiles,
      };

      // 如果删除的是当前配置，则重置当前配置
      if (currentProfileName === name) {
        updateData[this.CURRENT_PROFILE_KEY] = null;
      }

      const response = await ChromeService.setChromeStorage(updateData);
      return response.success;
    } catch (error) {
      console.error('Failed to delete profile:', error);
      return false;
    }
  }

  /**
   * 获取配置文件列表
   */
  static async getProfileList(): Promise<Profile[]> {
    try {
      const profiles = await this.getProfiles();
      return Object.values(profiles);
    } catch (error) {
      console.error('Failed to get profile list:', error);
      return [];
    }
  }

  /**
   * 更新当前配置文件
   */
  static async updateCurrentProfile(
    _domain: string,
    localStorage?: Record<string, string>,
    cookies?: Array<any>,
  ): Promise<boolean> {
    try {
      const currentProfileName = await this.getCurrentProfileName();
      if (!currentProfileName) {
        return false;
      }

      const profiles = await this.getProfiles();
      const currentProfile = profiles[currentProfileName];

      if (!currentProfile) {
        return false;
      }

      // 只更新提供的数据
      if (localStorage !== undefined && 'localStorage' in currentProfile.data) {
        (currentProfile.data as any).localStorage = localStorage;
      }

      if (cookies !== undefined && 'cookies' in currentProfile.data) {
        (currentProfile.data as any).cookies = cookies;
      }

      // 更新时间戳
      currentProfile.timestamp = Date.now();

      const response = await ChromeService.setChromeStorage({
        [this.STORAGE_KEY]: profiles,
      });

      return response.success;
    } catch (error) {
      console.error('Failed to update current profile:', error);
      return false;
    }
  }

  // ==================== 全局配置文件管理方法 ====================

  /**
   * 获取所有全局配置文件
   */
  static async getGlobalProfiles(): Promise<Record<string, Profile>> {
    try {
      const response = await ChromeService.getChromeStorage([ProfileManager.GLOBAL_PROFILES_KEY]);
      if (response.success && response.data) {
        return (response.data[ProfileManager.GLOBAL_PROFILES_KEY] as Record<string, Profile>) || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to get global profiles:', error);
      return {};
    }
  }

  /**
   * 创建全局配置文件
   */
  static async createGlobalProfile(
    name: string,
    description: string = '',
    domains: string[] = [],
  ): Promise<Profile> {
    const globalData: GlobalProfileData = {
      domains: {},
      accounts: {},
      backups: {},
      metadata: {
        version: ProfileManager.CURRENT_VERSION,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalDomains: 0,
        totalAccounts: 0,
        totalBackups: 0,
      },
    };

    // 为指定域名收集数据
    for (const domain of domains) {
      try {
        const domainData = await this.collectDomainData(domain);
        if (domainData) {
          globalData.domains[domain] = domainData;
          globalData.metadata.totalDomains++;
        }
      } catch (error) {
        console.error(`Failed to collect data for domain ${domain}:`, error);
      }
    }

    globalData.metadata.updatedAt = Date.now();

    return {
      name,
      description,
      data: globalData,
      timestamp: Date.now(),
      version: ProfileManager.CURRENT_VERSION,
    };
  }

  /**
   * 保存全局配置文件
   */
  static async saveGlobalProfile(profile: Profile, overwrite = false): Promise<boolean> {
    try {
      const profiles = await this.getGlobalProfiles();

      // 如果已存在且未选择覆盖，返回false
      if (profiles[profile.name] && !overwrite) {
        return false;
      }

      // 更新时间戳
      profile.timestamp = Date.now();
      profile.data.metadata.updatedAt = Date.now();

      profiles[profile.name] = profile;

      // 保存配置文件
      const saveResponse = await ChromeService.setChromeStorage({
        [ProfileManager.GLOBAL_PROFILES_KEY]: profiles,
      });

      return saveResponse.success;
    } catch (error) {
      console.error('Failed to save global profile:', error);
      return false;
    }
  }

  /**
   * 加载全局配置文件
   */
  static async loadGlobalProfile(name: string): Promise<boolean> {
    try {
      const profiles = await this.getGlobalProfiles();
      const profile = profiles[name];

      if (!profile) {
        console.error('Profile not found:', name);
        return false;
      }

      // 恢复所有域名的数据
      for (const [domain, domainData] of Object.entries(profile.data.domains)) {
        try {
          await this.restoreDomainData(domain, domainData);
        } catch (error) {
          console.error(`Failed to restore data for domain ${domain}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to load global profile:', error);
      return false;
    }
  }

  /**
   * 删除全局配置文件
   */
  static async deleteGlobalProfile(name: string): Promise<boolean> {
    try {
      const profiles = await this.getGlobalProfiles();

      if (!profiles[name]) {
        return false;
      }

      delete profiles[name];

      const saveResponse = await ChromeService.setChromeStorage({
        [ProfileManager.GLOBAL_PROFILES_KEY]: profiles,
      });

      return saveResponse.success;
    } catch (error) {
      console.error('Failed to delete global profile:', error);
      return false;
    }
  }

  /**
   * 收集指定域名的数据
   */
  private static async collectDomainData(domain: string): Promise<DomainData | null> {
    try {
      // 这里需要调用相应的服务来获取域名数据
      // 由于这是静态方法，我们需要通过其他方式获取数据
      const domainData: DomainData = {
        domain,
        localStorage: {},
        sessionStorage: {},
        cookies: [],
        timestamp: Date.now(),
      };

      // 注意：这里需要实际的数据收集逻辑
      // 在实际使用时，应该通过 StorageService 来获取数据

      return domainData;
    } catch (error) {
      console.error(`Failed to collect domain data for ${domain}:`, error);
      return null;
    }
  }

  /**
   * 恢复指定域名的数据
   */
  private static async restoreDomainData(domain: string, domainData: DomainData): Promise<void> {
    try {
      // 这里需要调用相应的服务来恢复域名数据
      // 注意：这里需要实际的数据恢复逻辑
      // 在实际使用时，应该通过 StorageService 来恢复数据
      console.log(`Restoring data for domain ${domain}:`, domainData);
    } catch (error) {
      console.error(`Failed to restore domain data for ${domain}:`, error);
      throw error;
    }
  }

  // ==================== 导入导出功能 ====================

  /**
   * 导出配置文件为JSON文件
   */
  static async exportProfile(profileName: string): Promise<string | null> {
    try {
      const profiles = await this.getGlobalProfiles();
      const profile = profiles[profileName];

      if (!profile) {
        console.error('Profile not found for export:', profileName);
        return null;
      }

      // 创建导出数据
      const exportData = {
        version: ProfileManager.CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        profile: profile,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export profile:', error);
      return null;
    }
  }

  /**
   * 导出所有配置文件为JSON文件
   */
  static async exportAllProfiles(): Promise<string | null> {
    try {
      const profiles = await this.getGlobalProfiles();

      // 创建导出数据
      const exportData = {
        version: ProfileManager.CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        profiles: profiles,
        totalProfiles: Object.keys(profiles).length,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export all profiles:', error);
      return null;
    }
  }

  /**
   * 下载配置文件
   */
  static downloadProfile(profileName: string, jsonData: string): void {
    try {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `storage-manager-pro-${profileName}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download profile:', error);
      throw error;
    }
  }

  /**
   * 下载所有配置文件
   */
  static downloadAllProfiles(jsonData: string): void {
    try {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `storage-manager-pro-all-profiles-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download all profiles:', error);
      throw error;
    }
  }

  /**
   * 导入配置文件
   */
  static async importProfile(importData: string, overwrite = false): Promise<{ success: boolean; message: string; profileName?: string }> {
    try {
      const data = JSON.parse(importData);

      // 验证数据格式
      if (!data.profile || !data.profile.name) {
        return { success: false, message: 'Invalid profile data format' };
      }

      const profile = data.profile as Profile;
      const profiles = await this.getGlobalProfiles();

      // 检查是否已存在
      if (profiles[profile.name] && !overwrite) {
        return { success: false, message: 'Profile already exists', profileName: profile.name };
      }

      // 保存配置文件
      const success = await this.saveGlobalProfile(profile, overwrite);

      if (success) {
        return { success: true, message: 'Profile imported successfully', profileName: profile.name };
      } else {
        return { success: false, message: 'Failed to save imported profile' };
      }
    } catch (error) {
      console.error('Failed to import profile:', error);
      return { success: false, message: 'Failed to parse import data' };
    }
  }
}

/**
 * 提取顶级域名的通用函数
 */
export function extractTopLevelDomain(domain: string): string {
  if (!domain) {
    return '';
  }

  // 处理特殊情况: localhost, IP地址
  if (domain === 'localhost' || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    return domain;
  }

  const parts = domain.split('.');

  // 处理 .co.uk, .com.cn 等情况
  if (parts.length >= 3) {
    const secondLevelTld = ['co.uk', 'com.cn', 'com.au', 'com.tw', 'co.jp'];
    const lastTwoParts = parts.slice(-2).join('.');

    if (secondLevelTld.includes(lastTwoParts)) {
      // 例如 example.co.uk，返回 example.co.uk
      return parts.slice(-3).join('.');
    }
  }

  // 一般情况下返回最后两部分，例如 example.com
  return parts.slice(-2).join('.');
}

/**
 * LocalStorage 备份管理器
 */
export class LocalStorageBackupManager {
  private static readonly STORAGE_KEY = 'localStorageBackups';

  /**
   * 获取所有备份
   */
  static async getBackups(): Promise<Record<string, Record<string, BackupData>>> {
    try {
      const response = await ChromeService.getChromeStorage([this.STORAGE_KEY]);
      if (response.success && response.data) {
        return (response.data[this.STORAGE_KEY] as Record<string, Record<string, BackupData>>) || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to get backups:', error);
      return {};
    }
  }

  /**
   * 创建备份
   */
  static async createBackup(
    domain: string,
    name: string,
    description: string,
    data: Record<string, string>,
    type: 'localStorage' | 'sessionStorage',
  ): Promise<string | null> {
    try {
      const backups = await this.getBackups();

      if (!backups[domain]) {
        backups[domain] = {};
      }

      const backupId = Date.now().toString();
      backups[domain][backupId] = {
        id: backupId,
        name,
        description,
        domain,
        data,
        timestamp: Date.now(),
        itemCount: Object.keys(data).length,
        type: type,
      };

      const response = await ChromeService.setChromeStorage({
        [this.STORAGE_KEY]: backups,
      });

      return response.success ? backupId : null;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  /**
   * 恢复备份
   */
  static async restoreBackup(domain: string, backupId: string): Promise<Record<string, string> | null> {
    try {
      const backups = await this.getBackups();

      if (backups[domain] && backups[domain][backupId]) {
        return backups[domain][backupId].data;
      }

      return null;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return null;
    }
  }

  /**
   * 删除备份
   */
  static async deleteBackup(domain: string, backupId: string): Promise<boolean> {
    try {
      const backups = await this.getBackups();

      if (backups[domain]) {
        delete backups[domain][backupId];

        const response = await ChromeService.setChromeStorage({
          [this.STORAGE_KEY]: backups,
        });

        return response.success;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * 获取域名的备份列表
   */
  static async getBackupList(domain: string): Promise<BackupData[]> {
    try {
      const backups = await this.getBackups();

      if (backups[domain]) {
        return Object.values(backups[domain]);
      }

      return [];
    } catch (error) {
      console.error('Failed to get backup list:', error);
      return [];
    }
  }
}

/**
 * Cookie 账户管理器
 */
export class CookieAccountManager {
  private static readonly STORAGE_KEY = 'cookieAccounts';

  /**
   * 获取所有账户
   */
  static async getAccounts(): Promise<Record<string, Record<string, AccountData>>> {
    try {
      const response = await ChromeService.getChromeStorage([this.STORAGE_KEY]);
      if (response.success && response.data) {
        return (response.data[this.STORAGE_KEY] as Record<string, Record<string, AccountData>>) || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return {};
    }
  }

  /**
   * 保存账户
   */
  static async saveAccount(
    domain: string,
    name: string,
    description: string,
    cookies: Array<any>,
  ): Promise<string | null> {
    try {
      // 使用顶级域名而不是完整域名
      const topDomain = extractTopLevelDomain(domain);
      const accounts = await this.getAccounts();

      console.log(`[Cookie Account Save] Saving account for domain: ${domain}, topDomain: ${topDomain}`);
      console.log('[Cookie Account Save] Cookie domains in account:', cookies.map(c => ({
        name: c.name,
        domain: c.domain,
        originalDomain: domain,
      })));

      if (!accounts[topDomain]) {
        accounts[topDomain] = {};
      }

      const accountId = Date.now().toString();
      accounts[topDomain][accountId] = {
        id: accountId,
        name,
        description,
        cookies,
        timestamp: Date.now(),
        cookieCount: cookies.length,
        domain: topDomain, // 添加顶级域名字段
        originalDomain: domain, // 保留原始域名以便参考
        domains: [domain], // 添加domains字段以符合AccountData接口
      };

      console.log(`[Cookie Account Save] Account saved with ID: ${accountId}, cookie count: ${cookies.length}`);

      const response = await ChromeService.setChromeStorage({
        [this.STORAGE_KEY]: accounts,
      });

      return response.success ? accountId : null;
    } catch (error) {
      console.error('Failed to save account:', error);
      return null;
    }
  }

  /**
   * 加载账户
   */
  static async loadAccount(domain: string, accountId: string): Promise<Array<any> | null> {
    try {
      // 使用顶级域名查找账号
      const topDomain = extractTopLevelDomain(domain);
      const accounts = await this.getAccounts();

      console.log(`[Cookie Account Load] Loading account for domain: ${domain}, topDomain: ${topDomain}, accountId: ${accountId}`);

      if (accounts[topDomain] && accounts[topDomain][accountId]) {
        const accountData = accounts[topDomain][accountId];
        const cookies = accountData.cookies;

        console.log(`[Cookie Account Load] Found account with ${cookies.length} cookies`);
        console.log('[Cookie Account Load] Cookie domains in loaded account:', cookies.map(c => ({
          name: c.name,
          domain: c.domain,
          requestedDomain: domain,
          topDomain: topDomain,
        })));

        return cookies;
      }

      console.log(`[Cookie Account Load] Account not found for topDomain: ${topDomain}, accountId: ${accountId}`);
      return null;
    } catch (error) {
      console.error('Failed to load account:', error);
      return null;
    }
  }

  /**
   * 删除账户
   */
  static async deleteAccount(domain: string, accountId: string): Promise<boolean> {
    try {
      // 使用顶级域名删除账号
      const topDomain = extractTopLevelDomain(domain);
      const accounts = await this.getAccounts();

      if (accounts[topDomain]) {
        delete accounts[topDomain][accountId];

        const response = await ChromeService.setChromeStorage({
          [this.STORAGE_KEY]: accounts,
        });

        return response.success;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete account:', error);
      return false;
    }
  }

  /**
   * 获取域名的账户列表
   */
  static async getAccountList(domain: string): Promise<AccountData[]> {
    try {
      // 使用顶级域名获取账号列表
      const topDomain = extractTopLevelDomain(domain);
      const accounts = await this.getAccounts();

      if (accounts[topDomain]) {
        return Object.values(accounts[topDomain]);
      }

      return [];
    } catch (error) {
      console.error('Failed to get account list:', error);
      return [];
    }
  }

  /**
   * 获取备份列表
   */
  static async getBackupList(storageType: string): Promise<any[]> {
    try {
      const result = await chrome.storage.local.get([`backups_${storageType}`]);
      return result[`backups_${storageType}`] || [];
    } catch (error) {
      console.error('Failed to get backup list:', error);
      return [];
    }
  }

  /**
   * 保存备份
   */
  static async saveBackup(storageType: string, backupData: any): Promise<void> {
    try {
      const backups = await this.getBackupList(storageType);
      backups.push(backupData);
      await chrome.storage.local.set({ [`backups_${storageType}`]: backups });
    } catch (error) {
      console.error('Failed to save backup:', error);
      throw error;
    }
  }

  /**
   * 加载备份
   */
  static async loadBackup(storageType: string, backupName: string): Promise<any> {
    try {
      const backups = await this.getBackupList(storageType);
      const backup = backups.find(b => b.name === backupName);
      if (!backup) {
        throw new Error('Backup not found');
      }
      return backup;
    } catch (error) {
      console.error('Failed to load backup:', error);
      throw error;
    }
  }

  /**
   * 删除备份
   */
  static async deleteBackup(storageType: string, backupName: string): Promise<void> {
    try {
      const backups = await this.getBackupList(storageType);
      const filteredBackups = backups.filter(b => b.name !== backupName);
      await chrome.storage.local.set({ [`backups_${storageType}`]: filteredBackups });
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }


}

// 导出类本身，因为所有方法都是静态的
export const ProfileService = ProfileManager;

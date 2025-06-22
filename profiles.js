// 配置文件管理模块
class ProfileManager {
  constructor() {
    this.profiles = {};
    this.currentProfileName = null; // 当前活动配置名称
    this.loadProfiles();
  }

  async loadProfiles() {
    const result = await chrome.storage.local.get(['profiles', 'currentProfileName']);
    this.profiles = result.profiles || {};
    this.currentProfileName = result.currentProfileName || null;
  }

  async saveProfiles() {
    await chrome.storage.local.set({ 
      profiles: this.profiles, 
      currentProfileName: this.currentProfileName 
    });
  }

  async saveProfile(name, data, overwrite = false) {
    // 如果已存在且未选择覆盖，返回false
    if (this.profiles[name] && !overwrite) {
      return false;
    }
    
    this.profiles[name] = {
      name: name,
      data: data,
      timestamp: Date.now()
    };
    
    // 设置为当前配置
    this.currentProfileName = name;
    
    await this.saveProfiles();
    return true;
  }

  async loadProfile(name) {
    // 更新当前配置名称
    if (this.profiles[name]) {
      this.currentProfileName = name;
      await this.saveProfiles();
    }
    return this.profiles[name];
  }

  async deleteProfile(name) {
    delete this.profiles[name];
    
    // 如果删除的是当前配置，则重置当前配置
    if (this.currentProfileName === name) {
      this.currentProfileName = null;
    }
    
    await this.saveProfiles();
  }

  getProfileList() {
    return Object.values(this.profiles);
  }
  
  // 获取当前配置名称
  getCurrentProfileName() {
    return this.currentProfileName;
  }
  
  // 自动更新当前配置（如果有）
  async updateCurrentProfile(domain, localStorage = null, cookies = null) {
    // 如果没有当前配置，不执行任何操作
    if (!this.currentProfileName || !this.profiles[this.currentProfileName]) {
      return false;
    }
    
    const currentProfile = this.profiles[this.currentProfileName];
    const data = currentProfile.data;
    
    // 只更新提供的数据
    if (localStorage !== null && data.includeLocalStorage) {
      data.localStorage = localStorage;
    }
    
    if (cookies !== null && data.includeCookies) {
      data.cookies = cookies;
    }
    
    // 更新时间戳
    currentProfile.timestamp = Date.now();
    
    await this.saveProfiles();
    return true;
  }
}

// 提取顶级域名的通用函数
function extractTopLevelDomain(domain) {
  if (!domain) return '';
  
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

// LocalStorage 备份管理
class LocalStorageBackupManager {
  constructor() {
    this.backups = {};
    this.loadBackups();
  }

  async loadBackups() {
    const result = await chrome.storage.local.get(['localStorageBackups']);
    this.backups = result.localStorageBackups || {};
  }

  async saveBackups() {
    await chrome.storage.local.set({ localStorageBackups: this.backups });
  }

  async createBackup(domain, name, description, data) {
    if (!this.backups[domain]) {
      this.backups[domain] = {};
    }
    
    const backupId = Date.now().toString();
    this.backups[domain][backupId] = {
      id: backupId,
      name: name,
      description: description,
      data: data,
      timestamp: Date.now(),
      itemCount: Object.keys(data).length
    };
    
    await this.saveBackups();
    return backupId;
  }

  async restoreBackup(domain, backupId) {
    if (this.backups[domain] && this.backups[domain][backupId]) {
      return this.backups[domain][backupId].data;
    }
    return null;
  }

  async deleteBackup(domain, backupId) {
    if (this.backups[domain]) {
      delete this.backups[domain][backupId];
      await this.saveBackups();
    }
  }

  getBackupList(domain) {
    if (this.backups[domain]) {
      return Object.values(this.backups[domain]);
    }
    return [];
  }
}

// Cookie 账户管理
class CookieAccountManager {
  constructor() {
    this.accounts = {};
    this.loadAccounts();
  }

  async loadAccounts() {
    const result = await chrome.storage.local.get(['cookieAccounts']);
    this.accounts = result.cookieAccounts || {};
  }

  async saveAccounts() {
    await chrome.storage.local.set({ cookieAccounts: this.accounts });
  }

  async saveAccount(domain, name, description, cookies) {
    // 使用顶级域名而不是完整域名
    const topDomain = extractTopLevelDomain(domain);
    
    if (!this.accounts[topDomain]) {
      this.accounts[topDomain] = {};
    }
    
    const accountId = Date.now().toString();
    this.accounts[topDomain][accountId] = {
      id: accountId,
      name: name,
      description: description,
      cookies: cookies,
      timestamp: Date.now(),
      cookieCount: cookies.length,
      originalDomain: domain // 保留原始域名以便参考
    };
    
    await this.saveAccounts();
    return accountId;
  }

  async loadAccount(domain, accountId) {
    // 使用顶级域名查找账号
    const topDomain = extractTopLevelDomain(domain);
    
    if (this.accounts[topDomain] && this.accounts[topDomain][accountId]) {
      return this.accounts[topDomain][accountId].cookies;
    }
    return null;
  }

  async deleteAccount(domain, accountId) {
    // 使用顶级域名删除账号
    const topDomain = extractTopLevelDomain(domain);
    
    if (this.accounts[topDomain]) {
      delete this.accounts[topDomain][accountId];
      await this.saveAccounts();
    }
  }

  getAccountList(domain) {
    // 使用顶级域名获取账号列表
    const topDomain = extractTopLevelDomain(domain);
    
    if (this.accounts[topDomain]) {
      return Object.values(this.accounts[topDomain]);
    }
    return [];
  }
}

// 导出实例
const profileManager = new ProfileManager();
const localStorageBackupManager = new LocalStorageBackupManager();
const cookieAccountManager = new CookieAccountManager();

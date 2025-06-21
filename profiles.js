// 配置文件管理模块
class ProfileManager {
  constructor() {
    this.profiles = {};
    this.loadProfiles();
  }

  async loadProfiles() {
    const result = await chrome.storage.local.get(['profiles']);
    this.profiles = result.profiles || {};
  }

  async saveProfiles() {
    await chrome.storage.local.set({ profiles: this.profiles });
  }

  async saveProfile(name, data) {
    this.profiles[name] = {
      name: name,
      data: data,
      timestamp: Date.now()
    };
    await this.saveProfiles();
  }

  async loadProfile(name) {
    return this.profiles[name];
  }

  async deleteProfile(name) {
    delete this.profiles[name];
    await this.saveProfiles();
  }

  getProfileList() {
    return Object.values(this.profiles);
  }
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
    if (!this.accounts[domain]) {
      this.accounts[domain] = {};
    }
    
    const accountId = Date.now().toString();
    this.accounts[domain][accountId] = {
      id: accountId,
      name: name,
      description: description,
      cookies: cookies,
      timestamp: Date.now(),
      cookieCount: cookies.length
    };
    
    await this.saveAccounts();
    return accountId;
  }

  async loadAccount(domain, accountId) {
    if (this.accounts[domain] && this.accounts[domain][accountId]) {
      return this.accounts[domain][accountId].cookies;
    }
    return null;
  }

  async deleteAccount(domain, accountId) {
    if (this.accounts[domain]) {
      delete this.accounts[domain][accountId];
      await this.saveAccounts();
    }
  }

  getAccountList(domain) {
    if (this.accounts[domain]) {
      return Object.values(this.accounts[domain]);
    }
    return [];
  }
}

// 导出实例
const profileManager = new ProfileManager();
const localStorageBackupManager = new LocalStorageBackupManager();
const cookieAccountManager = new CookieAccountManager();

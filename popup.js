let currentTab = 'localStorage';
let currentDomain = '';
let editingItem = null;
let editingType = '';
let selectedBackupId = null;
let selectedAccountId = null;

// 初始化配置文件选择器
async function initializeProfileSelector() {
  const profiles = profileManager.getProfileList();
  const profileSelect = document.getElementById('profileSelect');
  
  profileSelect.innerHTML = '<option value="">选择配置文件...</option>';
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.name;
    option.textContent = profile.name;
    profileSelect.appendChild(option);
  });
}

// 保存当前配置为配置文件
document.getElementById('saveProfile').addEventListener('click', function() {
  document.getElementById('profileModal').classList.add('show');
});

// 管理配置文件
document.getElementById('manageProfiles').addEventListener('click', function() {
  document.getElementById('profileModal').classList.add('show');
  loadProfileList();
});

// 加载配置文件列表
function loadProfileList() {
  const profiles = profileManager.getProfileList();
  const profileList = document.getElementById('profileList');
  
  if (profiles.length === 0) {
    profileList.innerHTML = '<div class="empty-state">暂无配置文件</div>';
    return;
  }
  
  profileList.innerHTML = profiles.map(profile => `
    <div class="profile-item">
      <div class="profile-info">
        <div class="profile-name">${escapeHtml(profile.name)}</div>
        <div class="profile-date">创建时间: ${new Date(profile.timestamp).toLocaleString()}</div>
      </div>
      <div class="profile-actions">
        <button class="profile-action-btn load-profile-btn" data-name="${escapeHtml(profile.name)}">加载</button>
        <button class="profile-action-btn delete-profile-btn" data-name="${escapeHtml(profile.name)}">删除</button>
      </div>
    </div>
  `).join('');
  
  // 添加事件监听
  profileList.querySelectorAll('.load-profile-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const profileName = this.dataset.name;
      await loadProfile(profileName);
      document.getElementById('profileModal').classList.remove('show');
    });
  });
  
  profileList.querySelectorAll('.delete-profile-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const profileName = this.dataset.name;
      if (confirm(`确定要删除配置文件 "${profileName}" 吗？`)) {
        await profileManager.deleteProfile(profileName);
        loadProfileList();
      }
    });
  });
}

// 保存新配置文件
document.getElementById('saveNewProfile').addEventListener('click', async function() {
  const profileName = document.getElementById('profileName').value.trim();
  if (!profileName) {
    alert('请输入配置文件名称');
    return;
  }
  
  const includeLocalStorage = document.getElementById('includeLocalStorage').checked;
  const includeCookies = document.getElementById('includeCookies').checked;
  
  const profileData = {
    domain: currentDomain,
    includeLocalStorage: includeLocalStorage,
    includeCookies: includeCookies,
    localStorage: {},
    cookies: []
  };
  
  // 获取当前数据
  if (includeLocalStorage) {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const result = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      }
    });
    
    if (result && result[0]) {
      profileData.localStorage = result[0].result;
    }
  }
  
  if (includeCookies) {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    profileData.cookies = await chrome.cookies.getAll({url: tab.url});
  }
  
  await profileManager.saveProfile(profileName, profileData);
  
  document.getElementById('profileModal').classList.remove('show');
  document.getElementById('profileName').value = '';
  initializeProfileSelector();
  alert(`配置文件 "${profileName}" 已保存`);
});

// 加载配置文件
async function loadProfile(profileName) {
  const profile = await profileManager.loadProfile(profileName);
  if (!profile || !profile.data) {
    alert('配置文件加载失败');
    return;
  }
  
  const data = profile.data;
  
  // 恢复 LocalStorage
  if (data.includeLocalStorage && data.localStorage) {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: (items) => {
        localStorage.clear();
        Object.entries(items).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      },
      args: [data.localStorage]
    });
  }
  
  // 恢复 Cookies
  if (data.includeCookies && data.cookies) {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    // 清除现有cookies
    const currentCookies = await chrome.cookies.getAll({url: tab.url});
    for (const cookie of currentCookies) {
      await chrome.cookies.remove({
        url: tab.url,
        name: cookie.name
      });
    }
    
    // 设置新cookies
    for (const cookie of data.cookies) {
      const cookieData = {
        url: tab.url,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly
      };
      
      if (cookie.expirationDate) {
        cookieData.expirationDate = cookie.expirationDate;
      }
      
      try {
        await chrome.cookies.set(cookieData);
      } catch (e) {
        console.error('设置cookie失败:', e);
      }
    }
  }
  
  loadStorageData();
  alert(`已加载配置文件: ${profileName}`);
}

// 配置文件选择器变化事件
document.getElementById('profileSelect').addEventListener('change', async function() {
  const profileName = this.value;
  if (profileName) {
    await loadProfile(profileName);
    this.value = '';
  }
});

// LocalStorage 备份功能
document.getElementById('backupLocalStorage').addEventListener('click', function() {
  document.getElementById('backupModalTitle').textContent = 'LocalStorage 备份';
  document.getElementById('backupSection').style.display = 'block';
  document.getElementById('restoreSection').style.display = 'none';
  document.getElementById('backupModal').classList.add('show');
});

// LocalStorage 恢复功能
document.getElementById('restoreLocalStorage').addEventListener('click', function() {
  document.getElementById('backupModalTitle').textContent = 'LocalStorage 恢复';
  document.getElementById('backupSection').style.display = 'none';
  document.getElementById('restoreSection').style.display = 'block';
  document.getElementById('backupModal').classList.add('show');
  loadBackupList();
});

// 加载备份列表
function loadBackupList() {
  const backups = localStorageBackupManager.getBackupList(currentDomain);
  const backupList = document.getElementById('backupList');
  
  if (backups.length === 0) {
    backupList.innerHTML = '<div class="empty-backup">暂无备份</div>';
    return;
  }
  
  backupList.innerHTML = backups.sort((a, b) => b.timestamp - a.timestamp).map(backup => `
    <div class="backup-item" data-id="${backup.id}">
      <div class="backup-name">${escapeHtml(backup.name)}</div>
      ${backup.description ? `<div class="backup-description">${escapeHtml(backup.description)}</div>` : ''}
      <div class="backup-meta">
        <span>创建时间: ${new Date(backup.timestamp).toLocaleString()}</span>
        <span>项目数: ${backup.itemCount}</span>
      </div>
      <div class="backup-actions">
        <button class="backup-action-btn delete-backup-btn" data-id="${backup.id}">删除</button>
      </div>
    </div>
  `).join('');
  
  // 选择备份
  backupList.querySelectorAll('.backup-item').forEach(item => {
    item.addEventListener('click', function() {
      backupList.querySelectorAll('.backup-item').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      selectedBackupId = this.dataset.id;
    });
  });
  
  // 删除备份
  backupList.querySelectorAll('.delete-backup-btn').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const backupId = this.dataset.id;
      if (confirm('确定要删除这个备份吗？')) {
        await localStorageBackupManager.deleteBackup(currentDomain, backupId);
        loadBackupList();
      }
    });
  });
}

// 确认备份/恢复
document.getElementById('confirmBackup').addEventListener('click', async function() {
  const isBackup = document.getElementById('backupSection').style.display !== 'none';
  
  if (isBackup) {
    // 创建备份
    const backupName = document.getElementById('backupName').value.trim();
    if (!backupName) {
      alert('请输入备份名称');
      return;
    }
    
    const backupDescription = document.getElementById('backupDescription').value.trim();
    
    // 获取当前 LocalStorage 数据
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const result = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      }
    });
    
    if (result && result[0]) {
      await localStorageBackupManager.createBackup(currentDomain, backupName, backupDescription, result[0].result);
      alert('备份创建成功！');
      document.getElementById('backupModal').classList.remove('show');
      document.getElementById('backupName').value = '';
      document.getElementById('backupDescription').value = '';
    }
  } else {
    // 恢复备份
    if (!selectedBackupId) {
      alert('请选择要恢复的备份');
      return;
    }
    
    if (confirm('恢复备份将覆盖当前的LocalStorage数据，确定要继续吗？')) {
      const backupData = await localStorageBackupManager.restoreBackup(currentDomain, selectedBackupId);
      if (backupData) {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        await chrome.scripting.executeScript({
          target: {tabId: tab.id},
          func: (items) => {
            localStorage.clear();
            Object.entries(items).forEach(([key, value]) => {
              localStorage.setItem(key, value);
            });
          },
          args: [backupData]
        });
        
        alert('备份恢复成功！');
        document.getElementById('backupModal').classList.remove('show');
        loadLocalStorage();
      }
    }
  }
});

// Cookie 账户保存功能
document.getElementById('saveCookieProfile').addEventListener('click', function() {
  document.getElementById('accountModalTitle').textContent = '保存Cookie账户';
  document.getElementById('saveAccountSection').style.display = 'block';
  document.getElementById('switchAccountSection').style.display = 'none';
  document.getElementById('accountModal').classList.add('show');
});

// Cookie 账户切换功能
document.getElementById('switchCookieProfile').addEventListener('click', function() {
  document.getElementById('accountModalTitle').textContent = '切换Cookie账户';
  document.getElementById('saveAccountSection').style.display = 'none';
  document.getElementById('switchAccountSection').style.display = 'block';
  document.getElementById('accountModal').classList.add('show');
  loadAccountList();
});

// 加载账户列表
function loadAccountList() {
  const accounts = cookieAccountManager.getAccountList(currentDomain);
  const accountList = document.getElementById('accountList');
  
  if (accounts.length === 0) {
    accountList.innerHTML = '<div class="empty-backup">暂无账户</div>';
    return;
  }
  
  accountList.innerHTML = accounts.sort((a, b) => b.timestamp - a.timestamp).map(account => `
    <div class="account-item" data-id="${account.id}">
      <div class="account-name">${escapeHtml(account.name)}</div>
      ${account.description ? `<div class="account-description">${escapeHtml(account.description)}</div>` : ''}
      <div class="account-meta">
        <span>保存时间: ${new Date(account.timestamp).toLocaleString()}</span>
        <span>Cookie数: ${account.cookieCount}</span>
      </div>
      <div class="account-actions">
        <button class="account-action-btn delete-account-btn" data-id="${account.id}">删除</button>
      </div>
    </div>
  `).join('');
  
  // 选择账户
  accountList.querySelectorAll('.account-item').forEach(item => {
    item.addEventListener('click', function() {
      accountList.querySelectorAll('.account-item').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      selectedAccountId = this.dataset.id;
    });
  });
  
  // 删除账户
  accountList.querySelectorAll('.delete-account-btn').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const accountId = this.dataset.id;
      if (confirm('确定要删除这个账户吗？')) {
        await cookieAccountManager.deleteAccount(currentDomain, accountId);
        loadAccountList();
      }
    });
  });
}

// 确认账户操作
document.getElementById('confirmAccount').addEventListener('click', async function() {
  const isSave = document.getElementById('saveAccountSection').style.display !== 'none';
  
  if (isSave) {
    // 保存账户
    const accountName = document.getElementById('accountName').value.trim();
    if (!accountName) {
      alert('请输入账户名称');
      return;
    }
    
    const accountDescription = document.getElementById('accountDescription').value.trim();
    
    // 获取当前 Cookies
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const cookies = await chrome.cookies.getAll({url: tab.url});
    
    await cookieAccountManager.saveAccount(currentDomain, accountName, accountDescription, cookies);
    alert(`账户 "${accountName}" 已保存！`);
    document.getElementById('accountModal').classList.remove('show');
    document.getElementById('accountName').value = '';
    document.getElementById('accountDescription').value = '';
  } else {
    // 切换账户
    if (!selectedAccountId) {
      alert('请选择要切换的账户');
      return;
    }
    
    if (confirm('切换账户将替换当前的所有Cookies，确定要继续吗？')) {
      const accountCookies = await cookieAccountManager.loadAccount(currentDomain, selectedAccountId);
      if (accountCookies) {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        // 清除现有cookies
        const currentCookies = await chrome.cookies.getAll({url: tab.url});
        for (const cookie of currentCookies) {
          await chrome.cookies.remove({
            url: tab.url,
            name: cookie.name
          });
        }
        
        // 设置新cookies
        for (const cookie of accountCookies) {
          const cookieData = {
            url: tab.url,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly
          };
          
          if (cookie.expirationDate) {
            cookieData.expirationDate = cookie.expirationDate;
          }
          
          try {
            await chrome.cookies.set(cookieData);
          } catch (e) {
            console.error('设置cookie失败:', e);
          }
        }
        
        alert('账户切换成功！');
        document.getElementById('accountModal').classList.remove('show');
        loadCookies();
      }
    }
  }
});

// 关闭弹窗
document.getElementById('closeProfileModal').addEventListener('click', function() {
  document.getElementById('profileModal').classList.remove('show');
});

document.getElementById('cancelProfile').addEventListener('click', function() {
  document.getElementById('profileModal').classList.remove('show');
});

document.getElementById('closeBackupModal').addEventListener('click', function() {
  document.getElementById('backupModal').classList.remove('show');
  selectedBackupId = null;
});

document.getElementById('cancelBackup').addEventListener('click', function() {
  document.getElementById('backupModal').classList.remove('show');
  selectedBackupId = null;
});

document.getElementById('closeAccountModal').addEventListener('click', function() {
  document.getElementById('accountModal').classList.remove('show');
  selectedAccountId = null;
});

document.getElementById('cancelAccount').addEventListener('click', function() {
  document.getElementById('accountModal').classList.remove('show');
  selectedAccountId = null;
});

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  initializeProfileSelector();
});

// 获取当前标签页信息
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (tabs[0]) {
    const url = new URL(tabs[0].url);
    currentDomain = url.hostname;
    document.getElementById('currentDomain').textContent = currentDomain;
    loadStorageData();
  }
});

// 标签切换
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', function() {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    this.classList.add('active');
    currentTab = this.dataset.tab;
    document.getElementById(currentTab).classList.add('active');
    
    loadStorageData();
  });
});

// 加载存储数据
async function loadStorageData() {
  switch(currentTab) {
    case 'localStorage':
      loadLocalStorage();
      break;
    case 'sessionStorage':
      loadSessionStorage();
      break;
    case 'cookies':
      loadCookies();
      break;
    case 'indexedDB':
      loadIndexedDB();
      break;
  }
}

// 加载LocalStorage
async function loadLocalStorage() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    }
  }, (results) => {
    if (results && results[0]) {
      displayStorageItems(results[0].result, 'localStorage');
    }
  });
}

// 加载SessionStorage
async function loadSessionStorage() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        items[key] = sessionStorage.getItem(key);
      }
      return items;
    }
  }, (results) => {
    if (results && results[0]) {
      displayStorageItems(results[0].result, 'sessionStorage');
    }
  });
}

// 加载Cookies
async function loadCookies() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const cookies = await chrome.cookies.getAll({url: tab.url});
  displayCookies(cookies);
}

// 加载IndexedDB
async function loadIndexedDB() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: async () => {
      const databases = await indexedDB.databases();
      const dbInfo = [];
      
      for (const db of databases) {
        const openReq = indexedDB.open(db.name);
        await new Promise((resolve) => {
          openReq.onsuccess = () => {
            const database = openReq.result;
            const stores = [];
            
            for (const storeName of database.objectStoreNames) {
              stores.push({
                name: storeName,
                count: '无法获取数量'
              });
            }
            
            dbInfo.push({
              name: db.name,
              version: database.version,
              stores: stores
            });
            
            database.close();
            resolve();
          };
          openReq.onerror = resolve;
        });
      }
      
      return dbInfo;
    }
  }, (results) => {
    if (results && results[0]) {
      displayIndexedDB(results[0].result);
    }
  });
}

// 显示存储项目
function displayStorageItems(items, type) {
  const listElement = document.getElementById(`${type}List`);
  listElement.innerHTML = '';
  
  if (Object.keys(items).length === 0) {
    listElement.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <p>暂无数据</p>
      </div>
    `;
    return;
  }
  
  const searchTerm = document.getElementById(`search${type.charAt(0).toUpperCase() + type.slice(1)}`).value.toLowerCase();
  
  Object.entries(items).forEach(([key, value]) => {
    if (searchTerm && !key.toLowerCase().includes(searchTerm) && !value.toLowerCase().includes(searchTerm)) {
      return;
    }
    
    const itemElement = createStorageItem(key, value, type);
    listElement.appendChild(itemElement);
  });
}

// 创建存储项目元素
function createStorageItem(key, value, type) {
  const item = document.createElement('div');
  item.className = 'storage-item';
  
  const isLongValue = value.length > 200;
  const displayValue = isLongValue ? value.substring(0, 200) + '...' : value;
  
  item.innerHTML = `
    <div class="storage-item-header">
      <div class="storage-key">${escapeHtml(key)}</div>
      <div class="storage-actions">
        <button class="action-btn edit-btn" data-key="${escapeHtml(key)}" data-type="${type}">编辑</button>
        <button class="action-btn delete-btn" data-key="${escapeHtml(key)}" data-type="${type}">删除</button>
      </div>
    </div>
    <div class="storage-value" data-full-value="${escapeHtml(value)}">
      ${escapeHtml(displayValue)}
      ${isLongValue ? '<button class="expand-btn">展开</button>' : ''}
    </div>
  `;
  
  // 编辑按钮事件
  item.querySelector('.edit-btn').addEventListener('click', function() {
    editingItem = key;
    editingType = type;
    openEditModal(key, value, type);
  });
  
  // 删除按钮事件
  item.querySelector('.delete-btn').addEventListener('click', function() {
    deleteStorageItem(key, type);
  });
  
  // 展开按钮事件
  const expandBtn = item.querySelector('.expand-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', function() {
      const valueElement = item.querySelector('.storage-value');
      if (valueElement.classList.contains('expanded')) {
        valueElement.classList.remove('expanded');
        valueElement.innerHTML = escapeHtml(displayValue) + '<button class="expand-btn">展开</button>';
      } else {
        valueElement.classList.add('expanded');
        valueElement.innerHTML = escapeHtml(value) + '<button class="expand-btn">收起</button>';
      }
      
      valueElement.querySelector('.expand-btn').addEventListener('click', arguments.callee);
    });
  }
  
  return item;
}

// 显示Cookies
function displayCookies(cookies) {
  const listElement = document.getElementById('cookiesList');
  listElement.innerHTML = '';
  
  if (cookies.length === 0) {
    listElement.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
        <p>暂无Cookies</p>
      </div>
    `;
    return;
  }
  
  const searchTerm = document.getElementById('searchCookies').value.toLowerCase();
  
  cookies.forEach(cookie => {
    if (searchTerm && !cookie.name.toLowerCase().includes(searchTerm) && !cookie.value.toLowerCase().includes(searchTerm)) {
      return;
    }
    
    const item = document.createElement('div');
    item.className = 'storage-item';
    
    item.innerHTML = `
      <div class="storage-item-header">
        <div class="storage-key">${escapeHtml(cookie.name)}</div>
        <div class="storage-actions">
          <button class="action-btn edit-btn">编辑</button>
          <button class="action-btn delete-btn">删除</button>
        </div>
      </div>
      <div class="storage-value">${escapeHtml(cookie.value)}</div>
      <div class="cookie-details">
        <span>域名: ${cookie.domain}</span>
        <span>路径: ${cookie.path}</span>
        ${cookie.expirationDate ? `<span>过期: ${new Date(cookie.expirationDate * 1000).toLocaleString()}</span>` : ''}
        ${cookie.secure ? '<span>🔒 Secure</span>' : ''}
        ${cookie.httpOnly ? '<span>🔐 HttpOnly</span>' : ''}
      </div>
    `;
    
    // 编辑按钮事件
    item.querySelector('.edit-btn').addEventListener('click', function() {
      editingItem = cookie;
      editingType = 'cookie';
      openEditModal(cookie.name, cookie.value, 'cookie', cookie);
    });
    
    // 删除按钮事件
    item.querySelector('.delete-btn').addEventListener('click', function() {
      deleteCookie(cookie);
    });
    
    listElement.appendChild(item);
  });
}

// 显示IndexedDB
function displayIndexedDB(databases) {
  const listElement = document.getElementById('indexedDBList');
  listElement.innerHTML = '';
  
  if (!databases || databases.length === 0) {
    listElement.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <p>暂无IndexedDB数据库</p>
      </div>
    `;
    return;
  }
  
  databases.forEach(db => {
    const item = document.createElement('div');
    item.className = 'db-item';
    
    let storesHtml = '';
    db.stores.forEach(store => {
      storesHtml += `
        <div class="object-store">
          <div class="store-name">${escapeHtml(store.name)}</div>
          <div class="store-count">记录数: ${store.count}</div>
        </div>
      `;
    });
    
    item.innerHTML = `
      <div class="db-name">数据库: ${escapeHtml(db.name)} (版本: ${db.version})</div>
      <div class="stores-container">
        ${storesHtml}
      </div>
    `;
    
    listElement.appendChild(item);
  });
}

// 打开编辑弹窗
function openEditModal(key, value, type, cookieData = null) {
  const modal = document.getElementById('editModal');
  const modalTitle = document.getElementById('modalTitle');
  const keyInput = document.getElementById('editKey');
  const valueInput = document.getElementById('editValue');
  const cookieFields = document.getElementById('cookieFields');
  
  modalTitle.textContent = editingItem === null ? '添加项目' : '编辑项目';
  keyInput.value = key || '';
  valueInput.value = value || '';
  
  if (type === 'cookie') {
    cookieFields.style.display = 'block';
    if (cookieData) {
      document.getElementById('editDomain').value = cookieData.domain || '';
      document.getElementById('editPath').value = cookieData.path || '/';
      document.getElementById('editSecure').checked = cookieData.secure || false;
      document.getElementById('editHttpOnly').checked = cookieData.httpOnly || false;
      
      if (cookieData.expirationDate) {
        const date = new Date(cookieData.expirationDate * 1000);
        document.getElementById('editExpires').value = date.toISOString().slice(0, 16);
      }
    }
  } else {
    cookieFields.style.display = 'none';
  }
  
  modal.classList.add('show');
}

// 关闭编辑弹窗
document.getElementById('closeModal').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);

function closeEditModal() {
  document.getElementById('editModal').classList.remove('show');
  editingItem = null;
  editingType = '';
}

// 保存编辑
document.getElementById('saveEdit').addEventListener('click', async function() {
  const key = document.getElementById('editKey').value;
  const value = document.getElementById('editValue').value;
  
  if (!key) {
    alert('键名不能为空');
    return;
  }
  
  if (editingType === 'cookie') {
    await saveCookie();
  } else {
    await saveStorageItem(key, value, editingType);
  }
  
  closeEditModal();
  loadStorageData();
});

// 保存存储项目
async function saveStorageItem(key, value, type) {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: (key, value, type, oldKey) => {
      if (type === 'localStorage') {
        if (oldKey && oldKey !== key) {
          localStorage.removeItem(oldKey);
        }
        localStorage.setItem(key, value);
      } else if (type === 'sessionStorage') {
        if (oldKey && oldKey !== key) {
          sessionStorage.removeItem(oldKey);
        }
        sessionStorage.setItem(key, value);
      }
    },
    args: [key, value, type, editingItem]
  });
}

// 保存Cookie
async function saveCookie() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const url = new URL(tab.url);
  
  const cookieData = {
    url: tab.url,
    name: document.getElementById('editKey').value,
    value: document.getElementById('editValue').value,
    domain: document.getElementById('editDomain').value || url.hostname,
    path: document.getElementById('editPath').value || '/',
    secure: document.getElementById('editSecure').checked,
    httpOnly: document.getElementById('editHttpOnly').checked
  };
  
  const expiresValue = document.getElementById('editExpires').value;
  if (expiresValue) {
    cookieData.expirationDate = new Date(expiresValue).getTime() / 1000;
  }
  
  // 如果是编辑现有cookie，先删除旧的
  if (editingItem && editingItem.name) {
    await chrome.cookies.remove({
      url: tab.url,
      name: editingItem.name
    });
  }
  
  await chrome.cookies.set(cookieData);
}

// 删除存储项目
async function deleteStorageItem(key, type) {
  if (confirm(`确定要删除 "${key}" 吗？`)) {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: (key, type) => {
        if (type === 'localStorage') {
          localStorage.removeItem(key);
        } else if (type === 'sessionStorage') {
          sessionStorage.removeItem(key);
        }
      },
      args: [key, type]
    }, () => {
      loadStorageData();
    });
  }
}

// 删除Cookie
async function deleteCookie(cookie) {
  if (confirm(`确定要删除Cookie "${cookie.name}" 吗？`)) {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    await chrome.cookies.remove({
      url: tab.url,
      name: cookie.name
    });
    
    loadCookies();
  }
}

// 添加按钮事件
document.getElementById('addLocalStorage').addEventListener('click', function() {
  editingItem = null;
  editingType = 'localStorage';
  openEditModal('', '', 'localStorage');
});

document.getElementById('addSessionStorage').addEventListener('click', function() {
  editingItem = null;
  editingType = 'sessionStorage';
  openEditModal('', '', 'sessionStorage');
});

document.getElementById('addCookie').addEventListener('click', function() {
  editingItem = null;
  editingType = 'cookie';
  openEditModal('', '', 'cookie');
});

// 清空按钮事件
document.getElementById('clearLocalStorage').addEventListener('click', async function() {
  if (confirm('确定要清空所有LocalStorage数据吗？')) {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => localStorage.clear()
    }, () => {
      loadLocalStorage();
    });
  }
});

document.getElementById('clearSessionStorage').addEventListener('click', async function() {
  if (confirm('确定要清空所有SessionStorage数据吗？')) {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => sessionStorage.clear()
    }, () => {
      loadSessionStorage();
    });
  }
});

document.getElementById('clearCookies').addEventListener('click', async function() {
  if (confirm('确定要清空所有Cookies吗？')) {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const cookies = await chrome.cookies.getAll({url: tab.url});
    
    for (const cookie of cookies) {
      await chrome.cookies.remove({
        url: tab.url,
        name: cookie.name
      });
    }
    
    loadCookies();
  }
});

// 刷新IndexedDB
document.getElementById('refreshIndexedDB').addEventListener('click', function() {
  loadIndexedDB();
});

// 搜索功能
document.getElementById('searchLocalStorage').addEventListener('input', loadLocalStorage);
document.getElementById('searchSessionStorage').addEventListener('input', loadSessionStorage);
document.getElementById('searchCookies').addEventListener('input', loadCookies);

// HTML转义函数
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

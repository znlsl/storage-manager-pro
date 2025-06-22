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
  const currentProfileName = profileManager.getCurrentProfileName();
  
  profileSelect.innerHTML = '<option value="">选择配置文件...</option>';
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.name;
    option.textContent = profile.name;
    profileSelect.appendChild(option);
  });
  
  // 显示当前配置信息
  const currentProfileInfo = document.createElement('div');
  currentProfileInfo.id = 'currentProfileInfo';
  currentProfileInfo.className = 'current-profile-info';
  
  // 插入到配置选择器下方
  const profileSelector = document.querySelector('.profile-selector');
  if (!document.getElementById('currentProfileInfo')) {
    profileSelector.insertAdjacentElement('afterend', currentProfileInfo);
  } else {
    currentProfileInfo.parentNode.replaceChild(currentProfileInfo, document.getElementById('currentProfileInfo'));
  }
  
  // 更新当前配置显示
  updateCurrentProfileDisplay();
}

// 更新当前配置显示
function updateCurrentProfileDisplay() {
  const currentProfileInfo = document.getElementById('currentProfileInfo');
  const currentProfileName = profileManager.getCurrentProfileName();
  
  if (currentProfileName && currentProfileInfo) {
    currentProfileInfo.innerHTML = `<span class="current-profile-label">当前配置: </span><span class="current-profile-name">${escapeHtml(currentProfileName)}</span>`;
    currentProfileInfo.style.display = 'block';
  } else if (currentProfileInfo) {
    currentProfileInfo.style.display = 'none';
  }
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
  
  // 检查是否已存在同名配置
  const profiles = profileManager.getProfileList();
  const existingProfile = profiles.find(p => p.name === profileName);
  let shouldOverwrite = false;
  
  if (existingProfile) {
    shouldOverwrite = confirm(`配置文件 "${profileName}" 已存在，是否覆盖？`);
    if (!shouldOverwrite) {
      return;
    }
  }
  
  const profileData = {
    domain: currentDomain,
    includeLocalStorage: includeLocalStorage,
    includeCookies: includeCookies,
    localStorage: {},
    cookies: []
  };
  
  try {
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      alert('无法访问当前标签页或该标签页是Chrome内部页面');
      return;
    }
    
    // 获取当前数据
    if (includeLocalStorage) {
      try {
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
      } catch (error) {
        console.error('获取localStorage失败:', error);
        alert(`获取localStorage失败: ${error.message}`);
      }
    }
    
    if (includeCookies) {
      try {
        const cookies = await chrome.cookies.getAll({url: tab.url});
        
        // 过滤无效的cookie，避免后续问题
        profileData.cookies = cookies.filter(cookie => {
          return cookie && cookie.name && cookie.domain;
        });
        
        console.log(`已保存${profileData.cookies.length}个有效cookies`);
      } catch (error) {
        console.error('获取cookies失败:', error);
        alert(`获取cookies失败: ${error.message}`);
      }
    }
    
    // 保存配置，支持覆盖
    const saved = await profileManager.saveProfile(profileName, profileData, shouldOverwrite);
    
    if (saved) {
      document.getElementById('profileModal').classList.remove('show');
      document.getElementById('profileName').value = '';
      initializeProfileSelector();
      alert(`配置文件 "${profileName}" 已保存`);
    } else {
      alert(`保存配置文件 "${profileName}" 失败`);
    }
  } catch (error) {
    console.error('保存配置文件过程中出错:', error);
    alert(`保存配置文件出错: ${error.message}`);
  }
});

// 加载配置文件
async function loadProfile(profileName) {
  const profile = await profileManager.loadProfile(profileName);
  if (!profile || !profile.data) {
    alert('配置文件加载失败');
    return;
  }
  
  const data = profile.data;
  let localStorageChanged = false;
  let cookiesChanged = false;
  
  // 恢复 LocalStorage
  if (data.includeLocalStorage && data.localStorage) {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
        console.error('无法访问当前标签页或该标签页是Chrome内部页面');
        return;
      }
      
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
      localStorageChanged = true;
    } catch (error) {
      console.error('恢复localStorage失败:', error);
      alert(`恢复localStorage失败: ${error.message}`);
    }
  }
  
  // 恢复 Cookies
  if (data.includeCookies) {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
        console.error('无法访问当前标签页或该标签页是Chrome内部页面');
        return;
      }
      
      console.log('处理配置中的cookies:', data.cookies);
      
      // 只有当配置中有cookie时才进行处理
      if (data.cookies && data.cookies.length > 0) {
        console.log('开始设置cookies，共', data.cookies.length, '个');
        
        // 清除现有cookies - 只在配置中有cookie时才清除
        const currentCookies = await chrome.cookies.getAll({url: tab.url});
        console.log('当前cookies数量:', currentCookies.length);
        
        for (const cookie of currentCookies) {
          try {
            await chrome.cookies.remove({
              url: tab.url,
              name: cookie.name
            });
          } catch (error) {
            console.error(`无法删除cookie ${cookie.name}:`, error);
          }
        }
        
        // 设置新cookies，使用Promise.all提高效率
        const setCookiePromises = data.cookies.map(async cookie => {
          // 跳过无效的cookie
          if (!cookie || !cookie.name) {
            console.warn('跳过无效cookie:', cookie);
            return 0;
          }
          
          const cookieData = {
            url: tab.url,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain || undefined,
            path: cookie.path || '/',
            secure: !!cookie.secure,
            httpOnly: !!cookie.httpOnly
          };
          
          if (cookie.expirationDate) {
            cookieData.expirationDate = cookie.expirationDate;
          }
          
          try {
            const result = await chrome.cookies.set(cookieData);
            return result ? 1 : 0;
          } catch (e) {
            console.error('设置cookie失败:', cookie.name, e);
            return 0;
          }
        });
        
        try {
          const results = await Promise.all(setCookiePromises);
          const successCount = results.reduce((a, b) => a + b, 0);
          console.log(`成功设置${successCount}个cookies，共${data.cookies.length}个`);
          
          // 验证cookies是否成功设置
          const verifiedCookies = await chrome.cookies.getAll({url: tab.url});
          console.log('设置后cookies数量:', verifiedCookies.length);
        } catch (error) {
          console.error('批量设置cookie时发生错误:', error);
        }
        
        cookiesChanged = true;
      } else {
        console.log('配置中无cookie数据，保留当前页面的cookie');
      }
    } catch (error) {
      console.error('恢复cookies过程中出错:', error);
      alert(`恢复cookies失败: ${error.message}`);
    }
  }
  
  // 等待一小段时间，确保cookies设置完成
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 根据当前标签页更新显示
  switch (currentTab) {
    case 'localStorage':
      if (localStorageChanged) {
        await loadLocalStorage();
      }
      break;
    case 'sessionStorage':
      await loadSessionStorage();
      break;
    case 'cookies':
      // 无论如何都刷新cookie显示，以确保数据是最新的
      await loadCookies();
      break;
    case 'indexedDB':
      await loadIndexedDB();
      break;
  }
  
  // 如果当前不在cookies标签页，但cookies已更改，则异步加载cookies数据
  if (currentTab !== 'cookies' && cookiesChanged) {
    await loadCookies(); // 无论如何都预加载cookies数据
  }
  
  updateCurrentProfileDisplay();
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
        
        alert('账户切换成功！页面将刷新以应用新的Cookie');
        document.getElementById('accountModal').classList.remove('show');
        
        // 刷新页面以应用新的cookie
        chrome.tabs.reload(tab.id);
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

// 加载页面初始化
document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || !tabs[0] || !tabs[0].url) {
      showErrorMessage("无法获取当前页面信息");
      return;
    }

    try {
      // 检查是否是chrome://、chrome-extension://等特殊URL
      const url = tabs[0].url;
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('devtools://')) {
        showErrorMessage("无法在Chrome内部页面上使用此扩展");
        disableControls();
        return;
      }

      const urlObj = new URL(tabs[0].url);
      currentDomain = urlObj.hostname;
      document.getElementById('currentDomain').textContent = currentDomain;
      
      initializeProfileSelector();
      loadStorageData();
      
      // 点击标签页切换
      document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
          document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
          
          this.classList.add('active');
          document.getElementById(this.dataset.tab).classList.add('active');
          currentTab = this.dataset.tab;
          
          loadStorageData();
        });
      });
    } catch (error) {
      console.error("初始化错误:", error);
      showErrorMessage("加载页面时发生错误: " + error.message);
    }
  });
});

// 显示错误信息
function showErrorMessage(message) {
  const container = document.querySelector('.container');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <p>${message}</p>
  `;
  
  // 如果已有错误信息，先移除
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // 插入到内容顶部
  container.insertBefore(errorDiv, container.firstChild);
}

// 禁用控件
function disableControls() {
  document.querySelectorAll('.tab-button, button:not(.close-btn)').forEach(btn => {
    btn.disabled = true;
  });
  
  document.querySelectorAll('input, select').forEach(input => {
    input.disabled = true;
  });
}

// 加载存储数据
async function loadStorageData() {
  switch (currentTab) {
    case 'localStorage':
      await loadLocalStorage();
      break;
    case 'sessionStorage':
      await loadSessionStorage();
      break;
    case 'cookies':
      await loadCookies();
      break;
    case 'indexedDB':
      await loadIndexedDB();
      break;
  }
  
  // 更新当前配置显示
  updateCurrentProfileDisplay();
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
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab || !tab.url) {
      console.error('无法获取当前标签页信息');
      displayCookies([]);
      return;
    }
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      console.log('当前页面是Chrome内部页面，无法访问cookie');
      displayCookies([]);
      return;
    }
    
    // 使用 await 确保获取到cookies
    const cookies = await chrome.cookies.getAll({url: tab.url});
    console.log(`已加载${cookies.length}个cookies:`, cookies);
    
    // 过滤无效的cookie
    const validCookies = cookies.filter(cookie => cookie && cookie.name);
    if (validCookies.length !== cookies.length) {
      console.warn(`过滤了${cookies.length - validCookies.length}个无效cookie`);
    }
    
    displayCookies(validCookies);
  } catch (error) {
    console.error('获取cookies失败:', error);
    displayCookies([]);
    
    // 在Cookie面板中显示错误信息
    const cookiesListElement = document.getElementById('cookiesList');
    cookiesListElement.innerHTML = `
      <div class="error-message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>加载Cookie失败: ${error.message}</p>
      </div>
    `;
  }
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
        try {
          const openReq = indexedDB.open(db.name);
          await new Promise((resolve) => {
            openReq.onsuccess = async () => {
              const database = openReq.result;
              const stores = [];
              const objectStoreNames = Array.from(database.objectStoreNames);
              
              // 为每个对象仓库获取详细信息
              for (const storeName of objectStoreNames) {
                try {
                  // 创建一个只读事务
                  const transaction = database.transaction(storeName, 'readonly');
                  const objectStore = transaction.objectStore(storeName);
                  
                  // 获取对象仓库的计数
                  const countRequest = objectStore.count();
                  const count = await new Promise((resolveCount, rejectCount) => {
                    countRequest.onsuccess = () => resolveCount(countRequest.result);
                    countRequest.onerror = () => rejectCount(new Error("获取计数失败"));
                  });
                  
                  // 获取对象仓库的前10条记录作为样本数据
                  let sampleData = [];
                  try {
                    const getRequest = objectStore.getAll(null, 10); // 限制为前10条记录
                    sampleData = await new Promise((resolveData, rejectData) => {
                      getRequest.onsuccess = () => {
                        const result = getRequest.result;
                        // 对于大对象，只返回简短概要以避免数据过大
                        const processedData = result.map(item => {
                          try {
                            return {
                              key: item.id || '未知', // 假设使用id作为键
                              preview: JSON.stringify(item).substring(0, 200) + (JSON.stringify(item).length > 200 ? '...' : '')
                            };
                          } catch (e) {
                            return { key: '无法处理', preview: '数据格式无法显示' };
                          }
                        });
                        resolveData(processedData);
                      };
                      getRequest.onerror = () => rejectData(new Error("获取数据失败"));
                    });
                  } catch (e) {
                    console.error('获取样本数据失败:', e);
                    sampleData = [{ key: '错误', preview: '无法获取数据: ' + e.message }];
                  }
                  
                  // 获取索引信息
                  const indices = [];
                  for (const indexName of Array.from(objectStore.indexNames)) {
                    indices.push(indexName);
                  }
                  
                  stores.push({
                    name: storeName,
                    count: count,
                    keyPath: objectStore.keyPath,
                    indices: indices,
                    sampleData: sampleData
                  });
                } catch (storeError) {
                  stores.push({
                    name: storeName,
                    count: '访问失败',
                    error: storeError.message
                  });
                }
              }
              
              dbInfo.push({
                name: db.name,
                version: database.version,
                stores: stores
              });
              
              database.close();
              resolve();
            };
            openReq.onerror = (error) => {
              // 处理打开数据库错误
              dbInfo.push({
                name: db.name,
                error: "无法打开数据库: " + error.target.error
              });
              resolve();
            };
          });
        } catch (dbError) {
          dbInfo.push({
            name: db.name,
            error: "处理数据库时出错: " + dbError.message
          });
        }
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
  
  // 确保cookies是数组
  if (!Array.isArray(cookies)) {
    console.error('cookies不是数组类型:', cookies);
    cookies = [];
  }
  
  console.log('显示cookies数量:', cookies.length);
  
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
  let displayedCount = 0;
  
  cookies.forEach(cookie => {
    if (!cookie || !cookie.name) {
      console.error('无效的cookie对象:', cookie);
      return;
    }
    
    if (searchTerm && !cookie.name.toLowerCase().includes(searchTerm) && 
        !cookie.value.toLowerCase().includes(searchTerm)) {
      return;
    }
    
    displayedCount++;
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
        <span>域名: ${escapeHtml(cookie.domain || '')}</span>
        <span>路径: ${escapeHtml(cookie.path || '/')}</span>
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
  
  console.log('实际显示cookie数量:', displayedCount);
  
  // 如果应该有cookie但没有显示，表明可能有问题
  if (cookies.length > 0 && displayedCount === 0) {
    listElement.innerHTML = `
      <div class="empty-state warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>找到 ${cookies.length} 个Cookie，但没有匹配当前搜索条件</p>
      </div>
    `;
  }
}

// 显示IndexedDB
function displayIndexedDB(databases) {
  const listElement = document.getElementById('indexedDBList');
  listElement.innerHTML = '';
  
  if (!databases || databases.length === 0) {
    listElement.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
        <p>暂无IndexedDB数据库</p>
      </div>
    `;
    return;
  }
  
  databases.forEach(db => {
    const dbElement = document.createElement('div');
    dbElement.className = 'db-item';
    
    // 如果有错误信息则显示
    if (db.error) {
      dbElement.innerHTML = `
        <div class="db-header">
          <h3>${escapeHtml(db.name)}</h3>
        </div>
        <div class="db-error">错误: ${escapeHtml(db.error)}</div>
      `;
      listElement.appendChild(dbElement);
      return;
    }
    
    dbElement.innerHTML = `
      <div class="db-header">
        <h3>${escapeHtml(db.name)}</h3>
        <span class="badge">v${db.version}</span>
      </div>
      <div class="stores-container"></div>
    `;
    
    const storesContainer = dbElement.querySelector('.stores-container');
    
    if (!db.stores || db.stores.length === 0) {
      storesContainer.innerHTML = '<div class="empty-state-small">无对象仓库</div>';
    } else {
      db.stores.forEach(store => {
        const storeElement = document.createElement('div');
        storeElement.className = 'store-item';
        
        // 构建索引信息
        let indicesHtml = '';
        if (store.indices && store.indices.length > 0) {
          indicesHtml = `
            <div class="store-indices">
              <div class="store-section-title">索引:</div>
              <div class="indices-list">${store.indices.map(idx => `<span class="index-badge">${escapeHtml(idx)}</span>`).join(' ')}</div>
            </div>
          `;
        }
        
        // 构建样本数据显示
        let sampleDataHtml = '';
        if (store.sampleData && store.sampleData.length > 0) {
          sampleDataHtml = `
            <div class="store-samples">
              <div class="store-section-title">样本数据 (前10条):</div>
              <div class="samples-container">
                ${store.sampleData.map(sample => `
                  <div class="sample-item">
                    <div class="sample-key">${escapeHtml(String(sample.key))}</div>
                    <div class="sample-preview">${escapeHtml(sample.preview)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
        
        // 构建错误信息
        let errorHtml = '';
        if (store.error) {
          errorHtml = `<div class="store-error">错误: ${escapeHtml(store.error)}</div>`;
        }
        
        storeElement.innerHTML = `
          <div class="store-header">
            <div class="store-name">${escapeHtml(store.name)}</div>
            <div class="store-meta">
              <span class="store-count">项目数: ${escapeHtml(String(store.count))}</span>
              ${store.keyPath ? `<span class="store-keypath">主键: ${escapeHtml(String(store.keyPath))}</span>` : ''}
            </div>
          </div>
          ${errorHtml}
          ${indicesHtml}
          ${sampleDataHtml}
        `;
        
        storesContainer.appendChild(storeElement);
      });
    }
    
    listElement.appendChild(dbElement);
  });

  // 添加样式
  const styleElement = document.getElementById('indexedDbStyles') || document.createElement('style');
  if (!document.getElementById('indexedDbStyles')) {
    styleElement.id = 'indexedDbStyles';
    styleElement.textContent = `
      .db-item {
        margin-bottom: 20px;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
      }
      .db-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #ddd;
      }
      .db-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      .badge {
        background: #e0e0e0;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
      }
      .store-item {
        padding: 12px 15px;
        border-bottom: 1px solid #eee;
      }
      .store-item:last-child {
        border-bottom: none;
      }
      .store-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }
      .store-name {
        font-weight: 600;
        color: #333;
      }
      .store-meta {
        font-size: 12px;
        color: #666;
      }
      .store-count, .store-keypath {
        margin-left: 10px;
      }
      .store-section-title {
        font-size: 13px;
        font-weight: 600;
        margin-top: 12px;
        margin-bottom: 8px;
      }
      .index-badge {
        display: inline-block;
        background: #eef2f7;
        padding: 2px 6px;
        margin: 2px;
        border-radius: 3px;
        font-size: 12px;
      }
      .store-samples {
        margin-top: 10px;
      }
      .sample-item {
        margin-bottom: 8px;
        border-left: 3px solid #e0e0e0;
        padding-left: 10px;
      }
      .sample-key {
        font-weight: 600;
        font-size: 12px;
        margin-bottom: 3px;
      }
      .sample-preview {
        font-family: monospace;
        font-size: 12px;
        background: #f7f7f7;
        padding: 8px;
        border-radius: 3px;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 100px;
        overflow-y: auto;
      }
      .store-error, .db-error {
        color: #d32f2f;
        font-size: 13px;
        padding: 8px;
        background-color: #ffebee;
        border-radius: 4px;
        margin-bottom: 10px;
      }
      .empty-state-small {
        font-size: 13px;
        color: #888;
        text-align: center;
        padding: 15px;
      }
    `;
    document.head.appendChild(styleElement);
  }
}

// 打开编辑弹窗
function openEditModal(key, value, type, cookieData = null) {
  const modal = document.getElementById('editModal');
  const modalTitle = document.getElementById('modalTitle');
  const keyInput = document.getElementById('editKey');
  const valueInput = document.getElementById('editValue');
  const cookieFields = document.getElementById('cookieFields');
  const modalFooter = document.querySelector('.modal-footer');
  
  modalTitle.textContent = editingItem === null ? '添加项目' : '编辑项目';
  keyInput.value = key || '';
  
  // 尝试格式化JSON
  let formattedValue = value || '';
  if (type === 'localStorage' || type === 'sessionStorage') {
    try {
      const jsonObj = JSON.parse(value);
      formattedValue = JSON.stringify(jsonObj, null, 2);
    } catch (e) {
      // 不是有效的JSON，使用原始值
      formattedValue = value;
    }
  }
  valueInput.value = formattedValue;
  
  // 确保按钮可见，特别是在内容较长的情况下
  modalFooter.style.position = 'sticky';
  modalFooter.style.bottom = '0';
  modalFooter.style.backgroundColor = 'white';
  modalFooter.style.zIndex = '20';
  
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
  
  // 添加格式化和压缩JSON按钮
  const formatSection = document.getElementById('formatSection') || document.createElement('div');
  formatSection.id = 'formatSection';
  formatSection.style.marginTop = '10px';
  formatSection.style.marginBottom = '15px'; // 增加底部间距，避免贴近操作按钮
  formatSection.innerHTML = `
    <button id="formatJson" class="btn btn-sm">格式化JSON</button>
    <button id="minifyJson" class="btn btn-sm">压缩JSON</button>
  `;
  
  // 如果是localStorage或sessionStorage，显示格式化按钮
  if (type === 'localStorage' || type === 'sessionStorage') {
    if (!document.getElementById('formatSection')) {
      document.querySelector('.modal-footer').insertAdjacentElement('beforebegin', formatSection);
    } else {
      formatSection.style.display = 'block';
    }
    
    // 绑定格式化按钮事件
    document.getElementById('formatJson').onclick = function() {
      try {
        const jsonObj = JSON.parse(valueInput.value);
        valueInput.value = JSON.stringify(jsonObj, null, 2);
      } catch (e) {
        alert('不是有效的JSON格式');
      }
    };
    
    // 绑定压缩按钮事件
    document.getElementById('minifyJson').onclick = function() {
      try {
        const jsonObj = JSON.parse(valueInput.value);
        valueInput.value = JSON.stringify(jsonObj);
      } catch (e) {
        alert('不是有效的JSON格式');
      }
    };
  } else if (document.getElementById('formatSection')) {
    formatSection.style.display = 'none';
  }
  
  // 设置模态框最大高度，确保在任何屏幕尺寸下都能看到操作按钮
  const modalContent = modal.querySelector('.modal-content');
  modalContent.style.maxHeight = '90vh';
  
  modal.classList.add('show');
  
  // 确保内容可正常滚动，按钮区域可见
  setTimeout(() => {
    const modalBody = modal.querySelector('.modal-body');
    modalBody.style.paddingBottom = '15px';
    
    // 应用完样式后滚动到顶部
    modalBody.scrollTop = 0;
    
    // 添加调整事件监听
    adjustModalSize();
    
    // 添加窗口大小变化事件监听
    window.addEventListener('resize', adjustModalSize);
  }, 10);
}

// 关闭编辑弹窗
document.getElementById('closeModal').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);

function closeEditModal() {
  document.getElementById('editModal').classList.remove('show');
  editingItem = null;
  editingType = '';
  
  // 移除窗口大小变化事件监听
  window.removeEventListener('resize', adjustModalSize);
}

// 调整模态框大小，确保按钮可见
function adjustModalSize() {
  const modal = document.getElementById('editModal');
  if (!modal.classList.contains('show')) return;
  
  const modalContent = modal.querySelector('.modal-content');
  const modalBody = modal.querySelector('.modal-body');
  const modalFooter = modal.querySelector('.modal-footer');
  
  // 获取视口高度
  const viewportHeight = window.innerHeight;
  
  // 确保模态框不超过视口高度的90%
  modalContent.style.maxHeight = `${viewportHeight * 0.9}px`;
  
  // 计算模态框头部和底部的高度
  const headerHeight = modal.querySelector('.modal-header').offsetHeight;
  const footerHeight = modalFooter.offsetHeight;
  
  // 计算模态框主体可用高度
  const availableHeight = viewportHeight * 0.9 - headerHeight - footerHeight;
  
  // 设置模态框主体高度
  modalBody.style.maxHeight = `${availableHeight}px`;
  
  // 确保在模态框内容过长时，底部按钮保持可见
  if (modalBody.scrollHeight > modalBody.clientHeight) {
    // 内容超出显示区域，设置底部按钮粘性定位
    modalFooter.style.position = 'sticky';
    modalFooter.style.bottom = '0';
    modalFooter.style.backgroundColor = 'white';
    modalFooter.style.zIndex = '20';
  }
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
  }, async () => {
    // 如果是localStorage，自动更新当前配置
    if (type === 'localStorage') {
      await updateCurrentProfileAfterLocalStorageChange();
    }
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
  
  // 自动更新当前配置的cookie
  await updateCurrentProfileAfterCookieChange();
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
    }, async () => {
      loadStorageData();
      
      // 如果是localStorage，自动更新当前配置
      if (type === 'localStorage') {
        await updateCurrentProfileAfterLocalStorageChange();
      }
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
    
    // 自动更新当前配置的cookie
    await updateCurrentProfileAfterCookieChange();
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

// 自动更新当前配置 - LocalStorage 修改后
async function updateCurrentProfileAfterLocalStorageChange() {
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
    await profileManager.updateCurrentProfile(currentDomain, result[0].result, null);
    // 更新配置显示
    updateCurrentProfileDisplay();
  }
}

// 自动更新当前配置 - Cookie 修改后
async function updateCurrentProfileAfterCookieChange() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const cookies = await chrome.cookies.getAll({url: tab.url});
  
  await profileManager.updateCurrentProfile(currentDomain, null, cookies);
  // 更新配置显示
  updateCurrentProfileDisplay();
}

let currentTab = 'localStorage';
let currentDomain = '';
let editingItem = null;
let editingType = '';
let selectedBackupId = null;
let selectedAccountId = null;
let isPinned = false;

// 初始化默认配置文件
async function initializeDefaultProfile() {
  try {
    // 先检查是否已有配置文件，如果有则不需要创建默认配置
    const hasAnyProfiles = await chrome.storage.local.get(['hasInitializedDefault']);
    
    // 如果已经初始化过默认配置，则直接返回
    if (hasAnyProfiles.hasInitializedDefault) {
      console.log('已经初始化过默认配置，跳过创建');
      return;
    }
    
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      console.error('无法访问当前标签页或该标签页是Chrome内部页面');
      return;
    }
    
    // 设置当前域名
    const url = new URL(tab.url);
    currentDomain = url.hostname;
    
    // 创建默认配置数据
    const defaultProfileData = {
      domain: currentDomain,
      includeLocalStorage: true,
      includeCookies: true,
      localStorage: {},
      cookies: [],
      settings: {
        language: languageManager.getCurrentLanguage()
      }
    };
    
    // 获取当前localStorage数据
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
        defaultProfileData.localStorage = result[0].result;
      }
    } catch (error) {
      console.error('获取localStorage失败:', error);
    }
    
    // 获取当前cookies数据
    try {
      const cookies = await chrome.cookies.getAll({url: tab.url});
      
      // 过滤无效的cookie
      defaultProfileData.cookies = cookies.filter(cookie => {
        return cookie && cookie.name && cookie.domain;
      });
    } catch (error) {
      console.error('获取cookies失败:', error);
    }
    
    // 保存默认配置
    const defaultName = `${languageManager.getText('default_profile')} (${currentDomain})`;
    await profileManager.saveProfile(defaultName, defaultProfileData, true);
    console.log('已创建默认配置文件:', defaultName);
    
    // 标记已初始化默认配置
    await chrome.storage.local.set({ hasInitializedDefault: true });
  } catch (error) {
    console.error('创建默认配置文件失败:', error);
  }
}

// 更新语言UI
function updateLanguageUI() {
  // 更新语言按钮
  document.getElementById('languageText').textContent = languageManager.getCurrentLanguage().toUpperCase();
  
  // 更新所有带有data-i18n属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = languageManager.getText(key);
    if (text) el.textContent = text;
  });
  
  // 更新所有带有data-i18n-placeholder属性的元素
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = languageManager.getText(key);
    if (text) el.placeholder = text;
  });
  
  // 更新所有带有data-i18n-title属性的元素
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const text = languageManager.getText(key);
    if (text) el.title = text;
  });
  
  // 更新当前配置显示
  updateCurrentProfileDisplay();
  
  // 更新所有存储项目的按钮文本
  updateStorageItemButtons();
  
  // 更新自定义对话框按钮文本
  updateDialogButtons();
  
  // 重新加载当前数据以更新空状态文本
  loadStorageData();
}

// 更新存储项目按钮文本
function updateStorageItemButtons() {
  // 更新编辑按钮
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.textContent = languageManager.getText('edit') || '编辑';
  });
  
  // 更新删除按钮
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.textContent = languageManager.getText('delete') || '删除';
  });
  
  // 更新显示更多/更少按钮
  document.querySelectorAll('.expand-btn').forEach(btn => {
    const isExpanded = btn.parentElement.classList.contains('expanded');
    btn.title = isExpanded 
      ? (languageManager.getText('show_less') || '显示更少')
      : (languageManager.getText('show_more') || '显示更多');
  });
}

// 更新对话框按钮文本
function updateDialogButtons() {
  const dialogCancel = document.getElementById('dialogCancel');
  const dialogConfirm = document.getElementById('dialogConfirm');
  
  if (dialogCancel) {
    dialogCancel.textContent = languageManager.getText('cancel') || '取消';
  }
  
  if (dialogConfirm) {
    dialogConfirm.textContent = languageManager.getText('ok') || '确定';
  }
}

// 语言切换事件
document.getElementById('switchLanguage').addEventListener('click', async function() {
  try {
    const currentLang = languageManager.getCurrentLanguage();
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    
    // 切换语言
    await languageManager.setLanguage(newLang);
    
    // 更新UI
    updateLanguageUI();
    
    // 更新当前配置
    await updateCurrentProfileAfterLanguageChange(newLang);
    
    console.log(`语言已切换为: ${newLang}`);
  } catch (error) {
    console.error('切换语言时出错:', error);
  }
});

// 添加语言变更后更新配置文件的方法
async function updateCurrentProfileAfterLanguageChange(language) {
  // 如果有当前配置，更新其中的语言设置
  const currentProfileName = profileManager.getCurrentProfileName();
  if (currentProfileName) {
    const profile = profileManager.profiles[currentProfileName];
    if (profile && profile.data) {
      if (!profile.data.settings) {
        profile.data.settings = {};
      }
      profile.data.settings.language = language;
      await profileManager.saveProfiles();
    }
  }
}

// 初始化配置文件选择器
async function initializeProfileSelector() {
  const profiles = profileManager.getProfileList();
  const profileSelect = document.getElementById('profileSelect');
  const currentProfileName = profileManager.getCurrentProfileName();
  
  // 设置选项的文本为多语言支持的文本
  const selectText = languageManager.getText('select_profile');
  profileSelect.innerHTML = `<option value="">${selectText}</option>`;
  
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.name;
    option.textContent = profile.name;
    profileSelect.appendChild(option);
  });
  
  // 如果有当前配置，设置下拉框的值
  if (currentProfileName) {
    profileSelect.value = currentProfileName;
  }
  
  // 显示当前配置信息
  const currentProfileInfo = document.createElement('div');
  currentProfileInfo.id = 'currentProfileInfo';
  currentProfileInfo.className = 'current-profile-info';
  
  // 插入到配置选择器下方
  const profileSelector = document.querySelector('.profile-selector');
  if (profileSelector) {
    const existingInfo = document.getElementById('currentProfileInfo');
    if (!existingInfo) {
      profileSelector.insertAdjacentElement('afterend', currentProfileInfo);
    } else if (existingInfo.parentNode) {
      existingInfo.parentNode.replaceChild(currentProfileInfo, existingInfo);
    } else {
      // 如果现有元素没有父节点，可能已经从DOM中移除，直接插入新元素
      profileSelector.insertAdjacentElement('afterend', currentProfileInfo);
    }
  }
  
  // 更新当前配置显示
  updateCurrentProfileDisplay();
}

  // 更新当前配置显示
function updateCurrentProfileDisplay() {
  const currentProfileInfo = document.getElementById('currentProfileInfo');
  
  // 如果元素不存在，则返回
  if (!currentProfileInfo) {
    return;
  }
  
  const currentProfileName = profileManager.getCurrentProfileName();
  
  if (currentProfileName) {
    try {
      const labelText = languageManager.getText('current_profile');
      currentProfileInfo.innerHTML = `<span class="current-profile-label">${labelText} </span><span class="current-profile-name">${escapeHtml(currentProfileName)}</span>`;
      currentProfileInfo.style.display = 'block';
    } catch (error) {
      console.error('更新配置显示错误:', error);
      // 降级处理，不使用翻译
      currentProfileInfo.innerHTML = `<span class="current-profile-label">当前配置: </span><span class="current-profile-name">${escapeHtml(currentProfileName)}</span>`;
      currentProfileInfo.style.display = 'block';
    }
  } else {
    currentProfileInfo.style.display = 'none';
  }
}

// 保存当前配置为配置文件
document.getElementById('saveProfile').addEventListener('click', function() {
  document.getElementById('saveProfileModal').classList.add('show');
});

// 管理配置文件
document.getElementById('manageProfiles').addEventListener('click', function() {
  document.getElementById('profileModal').classList.add('show');
  loadProfileList();
});

// 关闭保存配置文件弹窗
document.getElementById('closeSaveProfileModal').addEventListener('click', function() {
  document.getElementById('saveProfileModal').classList.remove('show');
});

// 取消保存配置文件
document.getElementById('cancelSaveProfile').addEventListener('click', function() {
  document.getElementById('saveProfileModal').classList.remove('show');
});

// 配置文件选择器变更事件
document.getElementById('profileSelect').addEventListener('change', async function() {
  const selectedProfile = this.value;
  if (selectedProfile) {
    await loadProfile(selectedProfile);
  }
});

// 加载配置文件列表
function loadProfileList() {
  const profiles = profileManager.getProfileList();
  const profileList = document.getElementById('profileList');
  
  if (profiles.length === 0) {
    const emptyText = languageManager.getText('no_profiles');
    profileList.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }
  
  const loadText = languageManager.getText('load');
  const deleteText = languageManager.getText('delete');
  const createdText = languageManager.getText('created_time');
  
  profileList.innerHTML = profiles.map(profile => `
    <div class="profile-item">
      <div class="profile-info">
        <div class="profile-name">${escapeHtml(profile.name)}</div>
        <div class="profile-date">${createdText} ${new Date(profile.timestamp).toLocaleString()}</div>
      </div>
      <div class="profile-actions">
        <button class="profile-action-btn load-profile-btn" data-name="${escapeHtml(profile.name)}">${loadText}</button>
        <button class="profile-action-btn delete-profile-btn" data-name="${escapeHtml(profile.name)}">${deleteText}</button>
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
      showConfirm(languageManager.getText('confirm_delete') + ' "' + profileName + '" ?', '确认删除', async function(confirmed) {
        if (confirmed) {
          await profileManager.deleteProfile(profileName);
          loadProfileList();
        }
      });
    });
  });
}

// 保存新配置文件
document.getElementById('saveNewProfile').addEventListener('click', async function() {
  const profileName = document.getElementById('profileName').value.trim();
  
  if (!profileName) {
    showAlert(languageManager.getText('please_enter_profile_name') || '请输入配置文件名称');
    return;
  }
  
  const includeLocalStorage = document.getElementById('includeLocalStorage').checked;
  const includeCookies = document.getElementById('includeCookies').checked;
  
  if (!includeLocalStorage && !includeCookies) {
    showAlert(languageManager.getText('please_select_content') || '请至少选择一种内容');
    return;
  }
  
  // 检查是否已存在同名配置
  const profiles = profileManager.getProfileList();
  const existingProfile = profiles.find(p => p.name === profileName);
  
  if (existingProfile) {
    // 显示确认覆盖对话框
    const confirmMessage = languageManager.getText('confirm_save_profile') || `配置文件 "{name}" 已存在，是否覆盖？`;
    const confirmTitle = languageManager.getText('overwrite_confirm') || '确认覆盖';
    
    showConfirm(
      confirmMessage.replace('{name}', profileName),
      confirmTitle,
      async function(confirmed) {
        if (confirmed) {
          await saveProfileData(profileName, includeLocalStorage, includeCookies, true);
          document.getElementById('saveProfileModal').classList.remove('show');
        }
      }
    );
  } else {
    // 如果没有同名配置，直接保存
    const success = await saveProfileData(profileName, includeLocalStorage, includeCookies);
    if (success) {
      document.getElementById('saveProfileModal').classList.remove('show');
    }
  }
});

// 提取保存配置文件的逻辑到单独的函数
async function saveProfileData(profileName, includeLocalStorage, includeCookies, overwrite = false) {
  // 获取当前标签页
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      console.error('无法访问当前标签页或该标签页是Chrome内部页面');
      const errorMessage = languageManager.getText('cannot_access_tab') || '无法访问当前标签页或该标签页是Chrome内部页面';
      const errorTitle = languageManager.getText('error') || '错误';
      showAlert(errorMessage, errorTitle);
      return;
    }
    
    // 设置当前域名
    const url = new URL(tab.url);
    currentDomain = url.hostname;
    
    // 创建配置数据
    const profileData = {
      domain: currentDomain,
      includeLocalStorage: includeLocalStorage,
      includeCookies: includeCookies,
      localStorage: {},
      cookies: [],
      settings: {
        language: languageManager.getCurrentLanguage()
      }
    };
    
    // 获取当前localStorage数据
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
      }
    }
    
    // 获取当前cookies数据
    if (includeCookies) {
      try {
        const cookies = await chrome.cookies.getAll({url: tab.url});
        profileData.cookies = cookies;
      } catch (error) {
        console.error('获取cookies失败:', error);
      }
    }
    
    // 保存配置文件
    try {
      await profileManager.saveProfile(profileName, profileData, overwrite);
      
      // 重新加载配置文件列表
      await initializeProfileSelector();
      
      // 更新当前配置显示
      updateCurrentProfileDisplay();
      
      // 显示成功消息
      const successMessage = languageManager.getText('profile_saved') || '配置已保存';
      const successTitle = languageManager.getText('success') || '操作成功';
      showAlert(successMessage, successTitle);
      
      return true;
    } catch (error) {
      console.error('保存配置文件失败:', error);
      const errorMessage = languageManager.getText('profile_save_failed') || '配置保存失败';
      const errorTitle = languageManager.getText('error') || '错误';
      showAlert(`${errorMessage}: ${error.message}`, errorTitle);
      return false;
    }
  } catch (error) {
    console.error('保存配置数据时出错:', error);
    const errorMessage = languageManager.getText('profile_save_failed') || '配置保存失败';
    const errorTitle = languageManager.getText('error') || '错误';
    showAlert(`${errorMessage}: ${error.message}`, errorTitle);
    return false;
  }
}

// 加载配置文件
async function loadProfile(profileName) {
  const profile = await profileManager.loadProfile(profileName);
  
  if (!profile) {
    showErrorMessage('无法加载配置文件: ' + profileName);
    return;
  }
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      console.error('无法访问当前标签页或该标签页是Chrome内部页面');
      return;
    }
    
    // 加载配置文件中的语言设置
    if (profile.data.settings && profile.data.settings.language) {
      const savedLanguage = profile.data.settings.language;
      if (savedLanguage !== languageManager.getCurrentLanguage()) {
        await languageManager.switchLanguage(savedLanguage);
        updateLanguageUI();
        languageManager.translatePage();
      }
    }
    
    disableControls();
    
    // 加载配置文件中的数据
    const data = profile.data;
    let localStorageChanged = false;
    let cookiesChanged = false;
    
    // 恢复 LocalStorage
    if (data.includeLocalStorage && data.localStorage) {
      try {
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
        showAlert(`恢复localStorage失败: ${error.message}`, '恢复失败');
      }
    }
    
    // 恢复 Cookies
    if (data.includeCookies) {
      try {
        console.log('处理配置中的cookies:', data.cookies);
        
        // 只有当配置中有cookie时才进行处理
        if (data.cookies && data.cookies.length > 0) {
          // 获取当前URL对象和顶级域名
          const urlObj = new URL(tab.url);
          const currentDomain = urlObj.hostname;
          const currentTopDomain = extractTopLevelDomain(currentDomain);
          
          console.log(`当前域名: ${currentDomain}, 顶级域名: ${currentTopDomain}`);
          
          // 筛选出与当前顶级域名匹配的cookie
          const compatibleCookies = data.cookies.filter(cookie => {
            if (!cookie || !cookie.domain) return false;
            
            const cookieDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
            const cookieTopDomain = extractTopLevelDomain(cookieDomain);
            
            // 检查是否是同一个顶级域名
            const isCompatible = cookieTopDomain === currentTopDomain;
            if (!isCompatible) {
              console.log(`跳过不匹配的cookie: ${cookie.name}, 域名: ${cookieDomain}, 顶级域名: ${cookieTopDomain}`);
            }
            return isCompatible;
          });
          
          console.log(`总共${data.cookies.length}个cookie, 与当前域名兼容的有${compatibleCookies.length}个`);
          
          if (compatibleCookies.length === 0) {
            console.log('没有可恢复的兼容cookie，保留当前页面cookie');
            cookiesChanged = false; // 标记没有实际改变cookie
          } else {
            console.log('开始设置cookies，共', compatibleCookies.length, '个');
            
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
            const setCookiePromises = compatibleCookies.map(async cookie => {
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
              console.log(`成功设置${successCount}个cookies，共${compatibleCookies.length}个`);
              
              // 验证cookies是否成功设置
              const verifiedCookies = await chrome.cookies.getAll({url: tab.url});
              console.log('设置后cookies数量:', verifiedCookies.length);
            } catch (error) {
              console.error('批量设置cookie时发生错误:', error);
            }
            
            cookiesChanged = true;
          }
        } else {
          console.log('配置中无cookie数据，保留当前页面的cookie');
        }
      } catch (error) {
        console.error('恢复cookies过程中出错:', error);
        showAlert(`恢复cookies失败: ${error.message}`, '恢复失败');
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
    
    // 在操作完成后恢复控件
    enableControls();
    
    updateCurrentProfileDisplay();
    // 使用自定义对话框
    showAlert(`已加载配置文件: ${profileName}`, '加载成功');
  } catch (error) {
    console.error('加载配置文件时出错:', error);
    // 恢复控件
    enableControls();
    showErrorMessage('加载配置文件时发生错误: ' + error.message);
  }
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
  const backupList = document.getElementById('backupList');
  const backups = localStorageBackupManager.getBackupList(currentDomain);
  
  if (backups.length === 0) {
    const emptyText = languageManager.getText('no_backups') || '暂无备份';
    backupList.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }
  
  const itemsText = languageManager.getText('items') || '项目';
  
  backupList.innerHTML = backups.map(backup => {
    const date = new Date(backup.timestamp).toLocaleString();
    const items = backup.itemCount || Object.keys(backup.data).length;
    
    return `
      <div class="backup-item${selectedBackupId === backup.id ? ' selected' : ''}" data-id="${backup.id}">
        <div class="backup-info">
          <div class="backup-name">${escapeHtml(backup.name)}</div>
          <div class="backup-date">${date}</div>
          <div class="backup-meta">${items} ${itemsText}</div>
          ${backup.description ? `<div class="backup-description">${escapeHtml(backup.description)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  // 添加点击事件监听
  backupList.querySelectorAll('.backup-item').forEach(item => {
    item.addEventListener('click', function() {
      // 移除其他项的选中状态
      backupList.querySelectorAll('.backup-item').forEach(i => i.classList.remove('selected'));
      // 添加当前项的选中状态
      this.classList.add('selected');
      selectedBackupId = this.dataset.id;
    });
    
    // 添加双击直接加载事件
    item.addEventListener('dblclick', async function() {
      selectedBackupId = this.dataset.id;
      await restoreSelectedBackup();
      document.getElementById('backupModal').classList.remove('show');
    });
  });
}

// 添加恢复所选备份的函数
async function restoreSelectedBackup() {
  if (!selectedBackupId) {
    showAlert(languageManager.getText('please_select_backup') || '请选择要恢复的备份');
    return;
  }
  
  try {
    const data = await localStorageBackupManager.restoreBackup(currentDomain, selectedBackupId);
    
    if (!data) {
      showAlert(languageManager.getText('backup_not_found') || '找不到备份数据');
      return;
    }
    
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      showAlert(languageManager.getText('cannot_access_tab') || '无法访问当前标签页或该标签页是Chrome内部页面');
      return;
    }
    
    // 恢复localStorage数据
    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: (data) => {
        // 先清空现有数据
        localStorage.clear();
        
        // 恢复备份数据
        for (const key in data) {
          localStorage.setItem(key, data[key]);
        }
        
        return localStorage.length;
      },
      args: [data]
    });
    
    // 更新UI
    await loadLocalStorage();
    
    // 更新当前配置
    await updateCurrentProfileAfterLocalStorageChange();
    
    showAlert(languageManager.getText('backup_restored') || '备份已恢复', '恢复成功');
  } catch (error) {
    console.error('恢复备份失败:', error);
    showAlert(languageManager.getText('restore_failed') || '恢复备份失败: ' + error.message, '恢复失败');
  }
}

// Cookie 账户保存功能
document.getElementById('saveCookieProfile').addEventListener('click', function() {
  const title = languageManager.getText('save_cookie_account') || '保存Cookie账户';
  document.getElementById('accountModalTitle').textContent = title;
  document.getElementById('saveAccountSection').style.display = 'block';
  document.getElementById('switchAccountSection').style.display = 'none';
  document.getElementById('accountModal').classList.add('show');
});

// Cookie 账户切换功能
document.getElementById('switchCookieProfile').addEventListener('click', function() {
  const title = languageManager.getText('switch_cookie_account') || '切换Cookie账户';
  document.getElementById('accountModalTitle').textContent = title;
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
    const emptyText = languageManager.getText('no_accounts') || '暂无账户';
    accountList.innerHTML = `<div class="empty-backup">${emptyText}</div>`;
    return;
  }
  
  const savedTimeText = languageManager.getText('saved_time') || '保存时间';
  const cookieCountText = languageManager.getText('cookie_count') || 'Cookie数';
  const deleteText = languageManager.getText('delete') || '删除';
  
  accountList.innerHTML = accounts.sort((a, b) => b.timestamp - a.timestamp).map(account => `
    <div class="account-item" data-id="${account.id}">
      <div class="account-name">${escapeHtml(account.name)}</div>
      ${account.description ? `<div class="account-description">${escapeHtml(account.description)}</div>` : ''}
      <div class="account-meta">
        <span>${savedTimeText}: ${new Date(account.timestamp).toLocaleString()}</span>
        <span>${cookieCountText}: ${account.cookieCount}</span>
      </div>
      <div class="account-actions">
        <button class="account-action-btn delete-account-btn" data-id="${account.id}">${deleteText}</button>
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
      
      const confirmMessage = languageManager.getText('confirm_delete_account') || '确定要删除这个账户吗？';
      const confirmTitle = languageManager.getText('confirm_title') || '确认删除';
      
      showConfirm(confirmMessage, confirmTitle, async function(confirmed) {
        if (confirmed) {
          await cookieAccountManager.deleteAccount(currentDomain, accountId);
          loadAccountList();
        }
      });
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
      const errorMessage = languageManager.getText('please_enter_account_name') || '请输入账户名称';
      const errorTitle = languageManager.getText('error') || '错误';
      showAlert(errorMessage, errorTitle);
      return;
    }
    
    const accountDescription = document.getElementById('accountDescription').value.trim();
    
    // 获取当前 Cookies
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const cookies = await chrome.cookies.getAll({url: tab.url});
    
    await cookieAccountManager.saveAccount(currentDomain, accountName, accountDescription, cookies);
    
    const successMessage = languageManager.getText('account_saved') || `账户 "${accountName}" 已保存！`;
    const successMessage2 = successMessage.replace('{name}', accountName);
    const successTitle = languageManager.getText('save_success') || '保存成功';
    
    showAlert(successMessage2, successTitle);
    document.getElementById('accountModal').classList.remove('show');
    document.getElementById('accountName').value = '';
    document.getElementById('accountDescription').value = '';
  } else {
    // 切换账户
    if (!selectedAccountId) {
      const errorMessage = languageManager.getText('please_select_account') || '请选择要切换的账户';
      const errorTitle = languageManager.getText('error') || '错误';
      showAlert(errorMessage, errorTitle);
      return;
    }
    
    const confirmMessage = languageManager.getText('confirm_switch_account') || '切换账户将替换当前的所有Cookies，确定要继续吗？';
    const confirmTitle = languageManager.getText('confirm') || '确认';
    
    showConfirm(confirmMessage, confirmTitle, async function(confirmed) {
      if (confirmed) {
        const accountCookies = await cookieAccountManager.loadAccount(currentDomain, selectedAccountId);
        if (accountCookies) {
          const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
          const url = new URL(tab.url);
          
          // 先删除所有当前的cookies
          const currentCookies = await chrome.cookies.getAll({url: tab.url});
          for (const cookie of currentCookies) {
            await chrome.cookies.remove({
              url: tab.url,
              name: cookie.name
            });
          }
          
          // 然后设置新的cookies
          for (const cookie of accountCookies) {
            // 确保cookie的domain和当前域名兼容
            if (!checkCookieDomainCompatibility(cookie.domain, url.hostname)) {
              console.log(`跳过不兼容的cookie: ${cookie.name}, domain: ${cookie.domain}`);
              continue;
            }
            
            // 准备cookie设置参数
            const cookieData = {
              url: tab.url,
              name: cookie.name,
              value: cookie.value,
              path: cookie.path || '/',
              secure: cookie.secure,
              httpOnly: cookie.httpOnly,
              sameSite: cookie.sameSite
            };
            
            // 如果有过期时间，添加到参数中
            if (cookie.expirationDate) {
              cookieData.expirationDate = cookie.expirationDate;
            }
            
            try {
              await chrome.cookies.set(cookieData);
            } catch (error) {
              console.error(`设置cookie失败: ${cookie.name}`, error);
            }
          }
          
          // 刷新cookie列表
          await loadCookies();
          
          // 更新当前配置
          await updateCurrentProfileAfterCookieChange();
          
          const successMessage = languageManager.getText('account_switched') || '账户已切换';
          const successTitle = languageManager.getText('switch_success') || '切换成功';
          
          showAlert(successMessage, successTitle);
          document.getElementById('accountModal').classList.remove('show');
        }
      }
    });
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
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // 先初始化语言
    console.log('开始初始化语言设置...');
    await languageManager.initializeLanguage();
    console.log('语言初始化完成，当前语言:', languageManager.getCurrentLanguage());
    updateLanguageUI();
    languageManager.translatePage();
    
    // 获取标签页信息
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tabs || !tabs[0] || !tabs[0].url) {
      showErrorMessage("无法获取当前页面信息");
      return;
    }

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
    
    // 初始化配置文件选择器和默认配置
    await initializeProfileSelector();
    await initializeDefaultProfile();
    await loadStorageData();

    // 初始化Pin功能
    initializePinFeature();
    
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

// 显示错误信息
function showErrorMessage(message) {
  const errorTitle = languageManager.getText('error') || '错误';
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

// 显示成功信息
function showSuccessMessage(message) {
  showAlert(message, languageManager.getText('success') || '成功');
}

// Pin功能实现
function initializePinFeature() {
  const pinBtn = document.getElementById('pinPopup');

  pinBtn.addEventListener('click', function() {
    isPinned = !isPinned;
    updatePinButton();

    if (isPinned) {
      // 固定弹窗 - 阻止默认的关闭行为
      document.body.style.pointerEvents = 'auto';
      // 可以添加其他固定逻辑
      console.log('弹窗已固定');
    } else {
      // 取消固定
      document.body.style.pointerEvents = '';
      console.log('弹窗已取消固定');
    }
  });
}

// 更新Pin按钮状态
function updatePinButton() {
  const pinBtn = document.getElementById('pinPopup');
  const pinIcon = pinBtn.querySelector('svg');

  if (isPinned) {
    pinBtn.classList.add('pinned');
    pinBtn.title = languageManager.getText('unpin_popup') || '取消固定';
    // 更改图标为已固定状态
    pinIcon.innerHTML = `
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"></path>
    `;
  } else {
    pinBtn.classList.remove('pinned');
    pinBtn.title = languageManager.getText('pin_popup') || '固定弹窗';
    // 恢复原始图标
    pinIcon.innerHTML = `
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
    `;
  }
}

// 禁用控件
function disableControls() {
  document.querySelectorAll('.tab-button, button:not(.close-btn)').forEach(btn => {
    btn.disabled = true;
  });
  
  document.querySelectorAll('input, select').forEach(input => {
    input.disabled = true;
  });
  
  console.log('已禁用所有控件');
}

// 恢复控件
function enableControls() {
  document.querySelectorAll('.tab-button, button:not(.close-btn)').forEach(btn => {
    btn.disabled = false;
  });
  
  document.querySelectorAll('input, select').forEach(input => {
    input.disabled = false;
  });
  
  console.log('已恢复所有控件');
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
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab || !tab.url) {
      console.error('无法获取当前标签页信息');
      displayStorageItems({}, 'localStorage');
      return;
    }
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      console.log('当前页面是Chrome内部页面，无法访问localStorage');
      displayStorageItems({}, 'localStorage');
      return;
    }
    
    const result = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => {
        try {
          const items = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            items[key] = localStorage.getItem(key);
          }
          return { success: true, data: items };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    });
    
    if (result && result[0] && result[0].result) {
      const scriptResult = result[0].result;
      if (!scriptResult.success) {
        showErrorMessage(`加载localStorage失败: ${scriptResult.error}`);
        displayStorageItems({}, 'localStorage');
      } else {
        displayStorageItems(scriptResult.data, 'localStorage');
      }
    }
  } catch (error) {
    console.error('加载localStorage失败:', error);
    showErrorMessage(`加载localStorage失败: ${error.message}`);
    displayStorageItems({}, 'localStorage');
  }
}

// 加载SessionStorage
async function loadSessionStorage() {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab || !tab.url) {
      console.error('无法获取当前标签页信息');
      displayStorageItems({}, 'sessionStorage');
      return;
    }
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      console.log('当前页面是Chrome内部页面，无法访问sessionStorage');
      displayStorageItems({}, 'sessionStorage');
      return;
    }
    
    const result = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => {
        try {
          const items = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            items[key] = sessionStorage.getItem(key);
          }
          return { success: true, data: items };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    });
    
    if (result && result[0] && result[0].result) {
      const scriptResult = result[0].result;
      if (!scriptResult.success) {
        showErrorMessage(`加载sessionStorage失败: ${scriptResult.error}`);
        displayStorageItems({}, 'sessionStorage');
      } else {
        displayStorageItems(scriptResult.data, 'sessionStorage');
      }
    }
  } catch (error) {
    console.error('加载sessionStorage失败:', error);
    showErrorMessage(`加载sessionStorage失败: ${error.message}`);
    displayStorageItems({}, 'sessionStorage');
  }
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
  const searchInput = document.getElementById(`search${type.charAt(0).toUpperCase() + type.slice(1)}`);
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  
  // 过滤项目
  const filteredItems = {};
  for (const key in items) {
    if (key.toLowerCase().includes(searchTerm) || items[key].toLowerCase().includes(searchTerm)) {
      filteredItems[key] = items[key];
    }
  }
  
  // 如果没有项目，显示空状态
  if (Object.keys(filteredItems).length === 0) {
    const noDataText = languageManager.getText('no_data') || '暂无数据';
    listElement.innerHTML = `<div class="empty-state">${noDataText}</div>`;
    return;
  }
  
  // 创建项目元素
  const fragment = document.createDocumentFragment();
  for (const key in filteredItems) {
    const item = createStorageItem(key, filteredItems[key], type);
    fragment.appendChild(item);
  }
  
  // 清空并添加新项目
  listElement.innerHTML = '';
  listElement.appendChild(fragment);
}

// 创建存储项目元素
function createStorageItem(key, value, type) {
  try {
    // 创建显示值的函数，尝试格式化JSON
    const displayValue = (val) => {
      try {
        // 检测是否是JSON字符串
        const parsed = JSON.parse(val);
        if (typeof parsed === 'object' && parsed !== null) {
          return JSON.stringify(parsed, null, 2);
        }
        return val;
      } catch (e) {
        return val;
      }
    };
    
    const item = document.createElement('div');
    item.className = 'storage-item';
    item.dataset.key = key;
    
    const header = document.createElement('div');
    header.className = 'item-header';
    
    const keyElement = document.createElement('div');
    keyElement.className = 'item-key';
    keyElement.textContent = key;
    
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    
    const editText = languageManager ? languageManager.getText('edit') : '编辑';
    const deleteText = languageManager ? languageManager.getText('delete') : '删除';
    
    // 创建编辑按钮
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn';
    editBtn.dataset.key = key;
    editBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      ${editText}
    `;
    
    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.dataset.key = key;
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
      ${deleteText}
    `;
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    header.appendChild(keyElement);
    header.appendChild(actions);
    
    const valueDisplay = document.createElement('pre');
    valueDisplay.className = 'item-value';
    valueDisplay.textContent = displayValue(value);
    
    // 如果值很长，添加展开按钮
    if (value && value.length > 100) {
      valueDisplay.classList.add('truncated');
      
      const expandBtn = document.createElement('button');
      expandBtn.className = 'expand-btn';
      expandBtn.textContent = '...';
      
      const showMoreText = languageManager ? languageManager.getText('show_more') : '显示更多';
      const showLessText = languageManager ? languageManager.getText('show_less') : '显示更少';
      
      expandBtn.title = showMoreText;
      
      expandBtn.addEventListener('click', function() {
        valueDisplay.classList.toggle('expanded');
        if (valueDisplay.classList.contains('expanded')) {
          expandBtn.title = showLessText;
        } else {
          expandBtn.title = showMoreText;
        }
      });
      
      valueDisplay.appendChild(expandBtn);
    }
    
    item.appendChild(header);
    item.appendChild(valueDisplay);
    
    // 添加事件监听
    editBtn.addEventListener('click', function() {
      editingItem = key; // 设置当前编辑的项目为键名
      editingType = type;
      openEditModal(key, value, type);
    });
    
    deleteBtn.addEventListener('click', function() {
      // 使用自定义确认弹窗
      const confirmMessage = languageManager 
        ? languageManager.getText('confirm_delete_item').replace('{name}', key)
        : `确定要删除 "${key}" 吗？`;
      
      const confirmTitle = languageManager
        ? languageManager.getText('confirm_title')
        : '确认删除';
        
      showConfirm(confirmMessage, confirmTitle, (confirmed) => {
        if (confirmed) {
          deleteStorageItem(key, type);
        }
      });
    });
    
    return item;
  } catch (error) {
    console.error('创建存储项时出错:', error);
    const errorItem = document.createElement('div');
    errorItem.className = 'storage-item error';
    errorItem.textContent = `无法显示: ${key}`;
    return errorItem;
  }
}

// 显示Cookies
function displayCookies(cookies) {
  const cookiesList = document.getElementById('cookiesList');
  const searchInput = document.getElementById('searchCookies');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  
  // 过滤Cookies
  const filteredCookies = cookies.filter(cookie => 
    cookie.name.toLowerCase().includes(searchTerm) || 
    cookie.value.toLowerCase().includes(searchTerm) ||
    cookie.domain.toLowerCase().includes(searchTerm)
  );
  
  // 如果没有Cookie，显示空状态
  if (cookies.length === 0) {
    const noCookiesText = languageManager.getText('no_cookies') || '暂无Cookies';
    cookiesList.innerHTML = `<div class="empty-state">${noCookiesText}</div>`;
    return;
  }
  
  // 如果有Cookie但没有匹配搜索条件
  if (cookies.length > 0 && filteredCookies.length === 0) {
    const noMatchText = languageManager.getText('no_matching_cookies') || '找到 Cookies，但没有匹配当前搜索条件';
    cookiesList.innerHTML = `<div class="empty-state">${noMatchText}</div>`;
    return;
  }
  
  // 获取翻译文本
  const editText = languageManager.getText('edit') || '编辑';
  const deleteText = languageManager.getText('delete') || '删除';
  const domainText = languageManager.getText('domain_field') || '域名';
  const pathText = languageManager.getText('path_field') || '路径';
  const expiresText = languageManager.getText('expires_field') || '过期时间';
  
  // 创建Cookie元素
  const fragment = document.createDocumentFragment();
  filteredCookies.forEach(cookie => {
    const cookieItem = document.createElement('div');
    cookieItem.className = 'storage-item';
    
    const expiresDate = cookie.expirationDate ? 
      new Date(cookie.expirationDate * 1000).toLocaleString() : 
      'Session';
    
    cookieItem.innerHTML = `
      <div class="item-header">
        <div class="item-key">${escapeHtml(cookie.name)}</div>
        <div class="item-actions">
          <button class="action-btn edit-btn" data-cookie-name="${escapeHtml(cookie.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            ${editText}
          </button>
          <button class="action-btn delete-btn" data-cookie-name="${escapeHtml(cookie.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            ${deleteText}
          </button>
        </div>
      </div>
      <div class="item-value">${escapeHtml(cookie.value)}</div>
      <div class="item-meta">
        <span>${domainText}: ${escapeHtml(cookie.domain)}</span>
        <span>${pathText}: ${escapeHtml(cookie.path)}</span>
        <span>${expiresText}: ${escapeHtml(expiresDate)}</span>
        ${cookie.secure ? '<span class="cookie-flag">Secure</span>' : ''}
        ${cookie.httpOnly ? '<span class="cookie-flag">HttpOnly</span>' : ''}
        ${cookie.sameSite ? `<span class="cookie-flag">SameSite=${escapeHtml(cookie.sameSite)}</span>` : ''}
      </div>
    `;
    
    // 添加编辑事件
    cookieItem.querySelector('.edit-btn').addEventListener('click', function() {
      const cookieName = this.dataset.cookieName;
      const cookie = cookies.find(c => c.name === cookieName);
      if (cookie) {
        editingItem = cookie; // 设置当前编辑的Cookie对象
        editingType = 'cookie';
        openEditModal(cookie.name, cookie.value, 'cookie', cookie);
      }
    });
    
    // 添加删除事件
    cookieItem.querySelector('.delete-btn').addEventListener('click', function() {
      const cookieName = this.dataset.cookieName;
      const cookie = cookies.find(c => c.name === cookieName);
      if (cookie) {
        const confirmMessage = languageManager.getText('confirm_delete_item') || '确定要删除 "{name}" 吗？';
        const confirmTitle = languageManager.getText('confirm_title') || '确认删除';
        
        showConfirm(
          confirmMessage.replace('{name}', cookie.name),
          confirmTitle,
          async function(confirmed) {
            if (confirmed) {
              await deleteCookie(cookie);
              await loadCookies();
            }
          }
        );
      }
    });
    
    fragment.appendChild(cookieItem);
  });
  
  // 清空并添加新Cookie
  cookiesList.innerHTML = '';
  cookiesList.appendChild(fragment);
}

// 显示IndexedDB
function displayIndexedDB(databases) {
  const indexedDBList = document.getElementById('indexedDBList');
  
  if (databases.length === 0) {
    const noDataText = languageManager.getText('no_indexeddb') || '暂无IndexedDB数据库';
    console.log(noDataText)
    indexedDBList.innerHTML = `<div class="empty-state">${noDataText}</div>`;
    return;
  }
  
  const errorText = languageManager.getText('indexeddb_error') || '错误';
  const storeCountText = languageManager.getText('store_count') || '项目数';
  const storeKeyPathText = languageManager.getText('store_keypath') || '主键';
  const indicesText = languageManager.getText('indices') || '索引';
  const sampleDataText = languageManager.getText('sample_data') || '样本数据 (前10条)';
  const noObjectStoresText = languageManager.getText('no_object_stores') || '无对象仓库';
  
  let html = '';
  
  databases.forEach(db => {
    html += `
      <div class="indexeddb-item">
        <div class="indexeddb-header">
          <div class="indexeddb-name">${escapeHtml(db.name)} (v${db.version})</div>
        </div>
    `;
    
    if (db.error) {
      html += `<div class="indexeddb-error">${errorText}: ${escapeHtml(db.error)}</div>`;
    } else if (!db.objectStores || db.objectStores.length === 0) {
      html += `<div class="empty-state">${noObjectStoresText}</div>`;
    } else {
      db.objectStores.forEach(store => {
        html += `
          <div class="objectstore-item">
            <div class="objectstore-header">
              <div class="objectstore-name">${escapeHtml(store.name)}</div>
              <div class="objectstore-meta">
                <span>${storeCountText}: ${store.count}</span>
                <span>${storeKeyPathText}: ${escapeHtml(store.keyPath || 'auto')}</span>
              </div>
            </div>
        `;
        
        // 显示索引
        if (store.indices && store.indices.length > 0) {
          html += `<div class="objectstore-indices"><strong>${indicesText}:</strong> ${store.indices.map(idx => escapeHtml(idx.name)).join(', ')}</div>`;
        }
        
        // 显示样本数据
        if (store.data && store.data.length > 0) {
          html += `
            <div class="objectstore-data">
              <div class="data-header">${sampleDataText}</div>
              <div class="data-content">
                <pre>${escapeHtml(JSON.stringify(store.data, null, 2))}</pre>
              </div>
            </div>
          `;
        }
        
        html += '</div>';
      });
    }
    
    html += '</div>';
  });
  
  indexedDBList.innerHTML = html;
}

// 打开编辑弹窗
function openEditModal(key, value, type, cookieData = null) {
  const modal = document.getElementById('editModal');
  const modalTitle = document.getElementById('modalTitle');
  const keyInput = document.getElementById('editKey');
  const valueInput = document.getElementById('editValue');
  const cookieFields = document.getElementById('cookieFields');
  const modalFooter = document.querySelector('.modal-footer');
  
  // 设置标题和字段值
  modalTitle.textContent = editingItem === null ? 
    (languageManager ? languageManager.getText('add_item') : '添加项目') : 
    (languageManager ? languageManager.getText('edit_item') : '编辑项目');
  
  keyInput.value = key || '';
  
  // 尝试格式化JSON
  let formattedValue = value || '';
  if ((type === 'localStorage' || type === 'sessionStorage') && value) {
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
  
  if (type === 'cookie' || type === 'cookies') {
    cookieFields.style.display = 'block';
    if (cookieData) {
      document.getElementById('editDomain').value = cookieData.domain || '';
      document.getElementById('editPath').value = cookieData.path || '/';
      document.getElementById('editSecure').checked = cookieData.secure || false;
      document.getElementById('editHttpOnly').checked = cookieData.httpOnly || false;
      document.getElementById('editSameSite').value = cookieData.sameSite || '';

      if (cookieData.expirationDate) {
        const date = new Date(cookieData.expirationDate * 1000);
        document.getElementById('editExpires').value = date.toISOString().slice(0, 16);
      } else {
        document.getElementById('editExpires').value = '';
      }
    } else {
      // 重置Cookie字段
      document.getElementById('editDomain').value = '';
      document.getElementById('editPath').value = '/';
      document.getElementById('editSecure').checked = false;
      document.getElementById('editHttpOnly').checked = false;
      document.getElementById('editSameSite').value = '';
      document.getElementById('editExpires').value = '';
    }
  } else {
    cookieFields.style.display = 'none';
  }
  
  // 添加格式化工具栏
  const formatSection = document.getElementById('formatSection') || document.createElement('div');
  formatSection.id = 'formatSection';
  formatSection.style.marginTop = '10px';
  formatSection.style.marginBottom = '15px'; // 增加底部间距，避免贴近操作按钮
  formatSection.innerHTML = `
    <div class="format-toolbar">
      <div class="format-group">
        <button id="formatJson" class="btn btn-sm format-btn" data-i18n="format_json">格式化JSON</button>
        <button id="minifyJson" class="btn btn-sm format-btn" data-i18n="minify_json">压缩JSON</button>
      </div>
      <div class="format-group">
        <button id="encodeBase64" class="btn btn-sm format-btn" data-i18n="encode_base64">Base64编码</button>
        <button id="decodeBase64" class="btn btn-sm format-btn" data-i18n="decode_base64">Base64解码</button>
      </div>
      <div class="format-group">
        <button id="encodeUtf8" class="btn btn-sm format-btn" data-i18n="encode_utf8">UTF-8编码</button>
        <button id="decodeUtf8" class="btn btn-sm format-btn" data-i18n="decode_utf8">UTF-8解码</button>
      </div>
    </div>
  `;

  // 应用多语言翻译
  if (languageManager) {
    formatSection.querySelector('[data-i18n="format_json"]').textContent =
      languageManager.getText('format_json');
    formatSection.querySelector('[data-i18n="minify_json"]').textContent =
      languageManager.getText('minify_json');
    formatSection.querySelector('[data-i18n="encode_base64"]').textContent =
      languageManager.getText('encode_base64');
    formatSection.querySelector('[data-i18n="decode_base64"]').textContent =
      languageManager.getText('decode_base64');
    formatSection.querySelector('[data-i18n="encode_utf8"]').textContent =
      languageManager.getText('encode_utf8');
    formatSection.querySelector('[data-i18n="decode_utf8"]').textContent =
      languageManager.getText('decode_utf8');
  }
  
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
        showSuccessMessage(languageManager.getText('format_json') + ' ' + (languageManager.getText('success') || '成功'));
      } catch (e) {
        showErrorMessage(languageManager.getText('invalid_json') || '不是有效的JSON格式');
      }
    };

    // 绑定压缩按钮事件
    document.getElementById('minifyJson').onclick = function() {
      try {
        const jsonObj = JSON.parse(valueInput.value);
        valueInput.value = JSON.stringify(jsonObj);
        showSuccessMessage(languageManager.getText('minify_json') + ' ' + (languageManager.getText('success') || '成功'));
      } catch (e) {
        showErrorMessage(languageManager.getText('invalid_json') || '不是有效的JSON格式');
      }
    };

    // 绑定Base64编码按钮事件
    document.getElementById('encodeBase64').onclick = function() {
      try {
        const text = valueInput.value;
        if (!text) {
          showErrorMessage(languageManager.getText('empty_content') || '内容不能为空');
          return;
        }
        const encoded = btoa(unescape(encodeURIComponent(text)));
        valueInput.value = encoded;
        showSuccessMessage(languageManager.getText('base64_encode_success') || 'Base64编码成功');
      } catch (e) {
        showErrorMessage(languageManager.getText('encoding_error') || '编码错误: ' + e.message);
      }
    };

    // 绑定Base64解码按钮事件
    document.getElementById('decodeBase64').onclick = function() {
      try {
        const text = valueInput.value;
        if (!text) {
          showErrorMessage(languageManager.getText('empty_content') || '内容不能为空');
          return;
        }
        // 验证Base64格式
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text)) {
          showErrorMessage(languageManager.getText('invalid_base64') || '无效的Base64格式');
          return;
        }
        const decoded = decodeURIComponent(escape(atob(text)));
        valueInput.value = decoded;
        showSuccessMessage(languageManager.getText('base64_decode_success') || 'Base64解码成功');
      } catch (e) {
        showErrorMessage(languageManager.getText('invalid_base64') || '无效的Base64格式');
      }
    };

    // 绑定UTF-8编码按钮事件
    document.getElementById('encodeUtf8').onclick = function() {
      try {
        const text = valueInput.value;
        if (!text) {
          showErrorMessage(languageManager.getText('empty_content') || '内容不能为空');
          return;
        }
        const encoded = Array.from(new TextEncoder().encode(text))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join(' ');
        valueInput.value = encoded;
        showSuccessMessage(languageManager.getText('utf8_encode_success') || 'UTF-8编码成功');
      } catch (e) {
        showErrorMessage(languageManager.getText('encoding_error') || '编码错误: ' + e.message);
      }
    };

    // 绑定UTF-8解码按钮事件
    document.getElementById('decodeUtf8').onclick = function() {
      try {
        const text = valueInput.value.trim();
        if (!text) {
          showErrorMessage(languageManager.getText('empty_content') || '内容不能为空');
          return;
        }
        // 验证十六进制格式
        const hexPattern = /^([0-9a-fA-F]{2}(\s+|$))+$/;
        if (!hexPattern.test(text)) {
          showErrorMessage(languageManager.getText('invalid_utf8') || '无效的UTF-8十六进制格式');
          return;
        }
        const bytes = text.split(/\s+/).filter(hex => hex).map(hex => parseInt(hex, 16));
        const decoded = new TextDecoder().decode(new Uint8Array(bytes));
        valueInput.value = decoded;
        showSuccessMessage(languageManager.getText('utf8_decode_success') || 'UTF-8解码成功');
      } catch (e) {
        showErrorMessage(languageManager.getText('invalid_utf8') || '无效的UTF-8格式');
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
  
  console.log(`打开编辑弹窗 - 类型: ${type}, 当前编辑项: ${editingItem}, 键: ${key}, 值长度: ${value ? value.length : 0}`);
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
    // saveCookie 函数内部已经调用了 closeEditModal()
  } else {
    await saveStorageItem(key, value, editingType);
    closeEditModal();
  }
});

// 保存存储项目
async function saveStorageItem(key, value, type) {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  // 添加调试日志
  console.log(`准备保存 - 类型: ${type}, 键: ${key}, 旧键: ${editingItem}, 值长度: ${value ? value.length : 0}`);
  
  try {
    // 注意: Chrome 扩展中，content script不能直接访问浏览器控制台日志
    // 所以页面内的console.log可能不会显示
    const result = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: (key, value, type, oldKey) => {
        try {
          // 检查参数
          if (!key) {
            return {success: false, error: '键名不能为空'};
          }
          
          if (type === 'localStorage') {
            // 如果有旧键且与新键不同，删除旧键
            if (oldKey && oldKey !== key) {
              localStorage.removeItem(oldKey);
            }
            // 设置新值
            localStorage.setItem(key, value);
            // 验证设置是否生效
            const storedValue = localStorage.getItem(key);
            if (storedValue !== value) {
              return {
                success: false, 
                error: '设置后验证失败，可能存储失败',
                expected: value,
                actual: storedValue
              };
            }
            return {success: true, length: localStorage.length};
          } else if (type === 'sessionStorage') {
            // 如果有旧键且与新键不同，删除旧键
            if (oldKey && oldKey !== key) {
              sessionStorage.removeItem(oldKey);
            }
            // 设置新值
            sessionStorage.setItem(key, value);
            // 验证设置是否生效
            const storedValue = sessionStorage.getItem(key);
            if (storedValue !== value) {
              return {
                success: false, 
                error: '设置后验证失败，可能存储失败',
                expected: value,
                actual: storedValue
              };
            }
            return {success: true, length: sessionStorage.length};
          }
          return {success: false, error: '未知的存储类型: ' + type};
        } catch (error) {
          return {success: false, error: error.message};
        }
      },
      args: [key, value, type, editingItem]
    });
    
    if (result && result[0] && result[0].result) {
      const scriptResult = result[0].result;
      if (!scriptResult.success) {
        console.error(`保存失败:`, scriptResult);
        showErrorMessage(`保存失败: ${scriptResult.error}`);
      } else {
        console.log(`保存成功，当前${type}项目数: ${scriptResult.length}`);
        
        // 如果是localStorage，自动更新当前配置
        if (type === 'localStorage') {
          await updateCurrentProfileAfterLocalStorageChange();
        }
        
        // 刷新显示
        if (type === 'localStorage') {
          await loadLocalStorage();
        } else if (type === 'sessionStorage') {
          await loadSessionStorage();
        }
      }
    } else {
      console.error('执行脚本返回结果无效:', result);
      showErrorMessage('保存失败: 执行脚本返回结果无效');
    }
  } catch (error) {
    console.error('保存存储项目时出错:', error);
    showErrorMessage(`保存失败: ${error.message}`);
  }
}

// 检查Cookie域名兼容性
function checkCookieDomainCompatibility(cookieDomain, currentHostname) {
  // 如果cookie域名不是以点开头，添加点前缀
  if (cookieDomain && !cookieDomain.startsWith('.')) {
    cookieDomain = '.' + cookieDomain;
  }

  // 如果当前域名不是以点开头，添加点前缀
  let hostname = currentHostname;
  if (!hostname.startsWith('.')) {
    hostname = '.' + hostname;
  }
  
  // 域名相同或当前域名是cookie域名的子域
  if (cookieDomain === hostname || hostname.endsWith(cookieDomain)) {
    return true;
  }
  
  return false;
}

// 保存Cookie
async function saveCookie() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const url = new URL(tab.url);
  
  // 获取Cookie数据
  let domain = document.getElementById('editDomain').value;
  
  // 如果域名为空，则使用当前页面的域名
  if (!domain) {
    domain = url.hostname;
  }
  
  // 检查域名兼容性
  if (!checkCookieDomainCompatibility(domain, url.hostname)) {
    showErrorMessage(`设置cookie失败: 域名"${domain}"与当前页面"${url.hostname}"不兼容。只有当cookie域名是当前域名或当前域名的父域时才能设置Cookie。`);
    return;
  }
  
  const cookieData = {
    url: tab.url,
    name: document.getElementById('editKey').value,
    value: document.getElementById('editValue').value,
    domain: domain,
    path: document.getElementById('editPath').value || '/',
    secure: document.getElementById('editSecure').checked,
    httpOnly: document.getElementById('editHttpOnly').checked
  };

  // 添加SameSite属性
  const sameSiteValue = document.getElementById('editSameSite').value;
  if (sameSiteValue) {
    cookieData.sameSite = sameSiteValue;
  }

  const expiresValue = document.getElementById('editExpires').value;
  if (expiresValue) {
    cookieData.expirationDate = new Date(expiresValue).getTime() / 1000;
  }
  
  try {
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
    
    // 关闭编辑窗口
    closeEditModal();
    
    // 刷新Cookie列表
    loadCookies();
  } catch (error) {
    showErrorMessage(`设置cookie失败: ${error.message}`);
  }
}

// 删除存储项目（内部函数，不显示确认对话框）
async function deleteStorageItem(key, type) {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    const result = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: (key, type) => {
        try {
          if (type === 'localStorage') {
            localStorage.removeItem(key);
            return {success: true, length: localStorage.length};
          } else if (type === 'sessionStorage') {
            sessionStorage.removeItem(key);
            return {success: true, length: sessionStorage.length};
          }
          return {success: false, error: 'Unknown storage type'};
        } catch (error) {
          return {success: false, error: error.message};
        }
      },
      args: [key, type]
    });

    if (result && result[0] && result[0].result) {
      const scriptResult = result[0].result;
      if (!scriptResult.success) {
        showErrorMessage(`删除失败: ${scriptResult.error}`);
      } else {
        console.log(`删除成功，当前${type}项目数: ${scriptResult.length}`);

        // 如果是localStorage，自动更新当前配置
        if (type === 'localStorage') {
          await updateCurrentProfileAfterLocalStorageChange();
        }

        // 刷新显示
        if (type === 'localStorage') {
          await loadLocalStorage();
        } else if (type === 'sessionStorage') {
          await loadSessionStorage();
        }
      }
    }
  } catch (error) {
    console.error('删除存储项目时出错:', error);
    showErrorMessage(`删除失败: ${error.message}`);
  }
}

// 删除Cookie（内部函数，不显示确认对话框）
async function deleteCookie(cookie) {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    await chrome.cookies.remove({
      url: tab.url,
      name: cookie.name
    });

    console.log(`已删除Cookie: ${cookie.name}`);
    await loadCookies();
    // 更新当前配置
    await updateCurrentProfileAfterCookieChange();
  } catch (error) {
    console.error('删除Cookie失败:', error);
    showErrorMessage(`删除Cookie失败: ${error.message}`);
  }
}

// 清空localStorage
document.getElementById('clearLocalStorage').addEventListener('click', function() {
  const confirmMessage = languageManager 
    ? languageManager.getText('confirm_clear_localStorage')
    : '确定要清空所有LocalStorage数据吗？';
  
  const confirmTitle = languageManager
    ? languageManager.getText('confirm_title')
    : '确认清空';
    
  showConfirm(confirmMessage, confirmTitle, async function(confirmed) {
    if (confirmed) {
      try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        const result = await chrome.scripting.executeScript({
          target: {tabId: tab.id},
          func: () => {
            try {
              localStorage.clear();
              return { success: true, length: localStorage.length };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }
        });
        
        if (result && result[0] && result[0].result) {
          const scriptResult = result[0].result;
          if (!scriptResult.success) {
            showErrorMessage(`清空localStorage失败: ${scriptResult.error}`);
          } else {
            console.log('已清空localStorage');
            await loadLocalStorage();
            // 更新当前配置
            await updateCurrentProfileAfterLocalStorageChange();
          }
        }
      } catch (error) {
        console.error('清空localStorage失败:', error);
        showErrorMessage(`清空localStorage失败: ${error.message}`);
      }
    }
  });
});

document.getElementById('clearSessionStorage').addEventListener('click', function() {
  const confirmMessage = languageManager 
    ? languageManager.getText('confirm_clear_sessionStorage')
    : '确定要清空所有SessionStorage数据吗？';
  
  const confirmTitle = languageManager
    ? languageManager.getText('confirm_title')
    : '确认清空';
    
  showConfirm(confirmMessage, confirmTitle, async function(confirmed) {
    if (confirmed) {
      try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        const result = await chrome.scripting.executeScript({
          target: {tabId: tab.id},
          func: () => {
            try {
              sessionStorage.clear();
              return { success: true, length: sessionStorage.length };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }
        });
        
        if (result && result[0] && result[0].result) {
          const scriptResult = result[0].result;
          if (!scriptResult.success) {
            showErrorMessage(`清空sessionStorage失败: ${scriptResult.error}`);
          } else {
            console.log('已清空sessionStorage');
            await loadSessionStorage();
          }
        }
      } catch (error) {
        console.error('清空sessionStorage失败:', error);
        showErrorMessage(`清空sessionStorage失败: ${error.message}`);
      }
    }
  });
});

document.getElementById('clearCookies').addEventListener('click', function() {
  const confirmMessage = languageManager 
    ? languageManager.getText('confirm_clear_cookies')
    : '确定要清空所有Cookies吗？';
  
  const confirmTitle = languageManager
    ? languageManager.getText('confirm_title')
    : '确认清空';
    
  showConfirm(confirmMessage, confirmTitle, async function(confirmed) {
    if (confirmed) {
      try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        const cookies = await chrome.cookies.getAll({url: tab.url});
        
        for (const cookie of cookies) {
          await chrome.cookies.remove({
            url: tab.url,
            name: cookie.name
          });
        }
        
        loadCookies();
        
        // 自动更新当前配置的cookie
        await updateCurrentProfileAfterCookieChange();
        
        const successMessage = languageManager 
          ? languageManager.getText('cookies_cleared')
          : '所有Cookie已清除';
          
        const successTitle = languageManager
          ? languageManager.getText('success')
          : '清除成功';
          
        showAlert(successMessage, successTitle);
      } catch (error) {
        console.error('清空cookies失败:', error);
        showErrorMessage(`清空cookies失败: ${error.message}`);
      }
    }
  });
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

// extractTopLevelDomain函数已在profiles.js中定义

// 创建备份
document.getElementById('confirmBackup').addEventListener('click', async function() {
  const isBackup = document.getElementById('backupSection').style.display !== 'none';
  
  if (isBackup) {
    // 创建备份
    const backupName = document.getElementById('backupName').value.trim();
    if (!backupName) {
      showAlert(languageManager.getText('please_enter_backup_name') || '请输入备份名称');
      return;
    }
    
    const backupDescription = document.getElementById('backupDescription').value.trim();
    
    try {
      // 获取当前 LocalStorage 数据
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
        showAlert(languageManager.getText('cannot_access_tab') || '无法访问当前标签页');
        return;
      }
      
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
        showAlert(languageManager.getText('backup_created') || '备份创建成功！', '备份成功');
        document.getElementById('backupModal').classList.remove('show');
        document.getElementById('backupName').value = '';
        document.getElementById('backupDescription').value = '';
      }
    } catch (error) {
      console.error('创建备份失败:', error);
      showAlert(languageManager.getText('backup_create_failed') || '创建备份失败: ' + error.message, '创建失败');
    }
  } else {
    // 恢复备份
    await restoreSelectedBackup();
    document.getElementById('backupModal').classList.remove('show');
  }
});

// 显示提示对话框
function showAlert(message, title = null, callback = null) {
  const alertTitle = title || languageManager.getText('alert_title') || '提示';
  
  showCustomDialog(message, alertTitle, {
    confirmText: languageManager.getText('ok') || '确定'
  }).then(result => {
    if (callback) callback(result);
  });
}

// 显示确认对话框
function showConfirm(message, title = null, callback = null) {
  const confirmTitle = title || languageManager.getText('confirm_title') || '确认';
  
  showCustomDialog(message, confirmTitle, {
    showCancel: true,
    confirmText: languageManager.getText('yes') || '是',
    cancelText: languageManager.getText('no') || '否'
  }).then(result => {
    if (callback) callback(result);
  });
}

// 自定义对话框函数
function showCustomDialog(message, title = '提示', options = {}) {
  return new Promise((resolve) => {
    const dialog = document.getElementById('customDialog');
    const dialogTitle = document.getElementById('dialogTitle');
    const dialogMessage = document.getElementById('dialogMessage');
    const dialogCancel = document.getElementById('dialogCancel');
    const dialogConfirm = document.getElementById('dialogConfirm');
    const existingProfilesList = document.getElementById('existingProfilesList');

    // 设置标题和消息
    dialogTitle.textContent = title;
    dialogMessage.textContent = message;

    // 设置按钮文本
    dialogConfirm.textContent = options.confirmText || '确定';
    dialogCancel.textContent = options.cancelText || '取消';

    // 控制取消按钮显示
    if (options.showCancel) {
      dialogCancel.style.display = 'inline-block';
    } else {
      dialogCancel.style.display = 'none';
    }

    // 处理配置文件列表
    if (options.profileList) {
      existingProfilesList.style.display = 'block';
      existingProfilesList.innerHTML = '';
      options.profileList.forEach(profile => {
        const profileItem = document.createElement('div');
        profileItem.className = 'profile-item';
        profileItem.textContent = profile.name;
        profileItem.style.cursor = 'pointer';
        profileItem.style.padding = '8px';
        profileItem.style.borderBottom = '1px solid #eee';
        profileItem.addEventListener('click', () => {
          dialog.classList.remove('show');
          if (options.onProfileSelect) {
            options.onProfileSelect(profile.name);
          }
          resolve(profile.name);
        });
        existingProfilesList.appendChild(profileItem);
      });
    } else {
      existingProfilesList.style.display = 'none';
    }

    // 移除之前的事件监听器
    const newDialogConfirm = dialogConfirm.cloneNode(true);
    const newDialogCancel = dialogCancel.cloneNode(true);
    const newCloseDialog = document.getElementById('closeDialog').cloneNode(true);

    dialogConfirm.parentNode.replaceChild(newDialogConfirm, dialogConfirm);
    dialogCancel.parentNode.replaceChild(newDialogCancel, dialogCancel);
    document.getElementById('closeDialog').parentNode.replaceChild(newCloseDialog, document.getElementById('closeDialog'));

    // 添加新的事件监听器
    newDialogConfirm.addEventListener('click', () => {
      dialog.classList.remove('show');
      resolve(true);
    });

    newDialogCancel.addEventListener('click', () => {
      dialog.classList.remove('show');
      resolve(false);
    });

    newCloseDialog.addEventListener('click', () => {
      dialog.classList.remove('show');
      resolve(false);
    });

    // 点击背景关闭
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.classList.remove('show');
        resolve(false);
      }
    });

    // 显示对话框
    dialog.classList.add('show');
  });
}

// 显示配置文件列表对话框
function showProfileListDialog(message, profileList, title = null, callback = null) {
  const dialogTitle = title || languageManager.getText('select_profile') || '选择配置文件';

  showCustomDialog(message, dialogTitle, {
    showCancel: true,
    profileList: profileList,
    confirmText: languageManager.getText('cancel') || '取消',
    onProfileSelect: (profileName) => {
      if (callback) callback(profileName);
    }
  }).then(result => {
    if (!result && callback) callback(null);
  });
}

// 添加LocalStorage项目事件
document.getElementById('addLocalStorage').addEventListener('click', function() {
  editingItem = null;
  editingType = 'localStorage';
  openEditModal('', '', 'localStorage');
});

// 添加SessionStorage项目事件
document.getElementById('addSessionStorage').addEventListener('click', function() {
  editingItem = null;
  editingType = 'sessionStorage';
  openEditModal('', '', 'sessionStorage');
});

// 添加Cookie项目事件
document.getElementById('addCookie').addEventListener('click', function() {
  editingItem = null;
  editingType = 'cookie';
  openEditModal('', '', 'cookie');
});

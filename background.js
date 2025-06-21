// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Storage Manager Pro installed');
  // 初始化存储结构
  chrome.storage.local.get(['profiles', 'localStorageBackups', 'cookieAccounts'], (result) => {
    if (!result.profiles) {
      chrome.storage.local.set({ profiles: {} });
    }
    if (!result.localStorageBackups) {
      chrome.storage.local.set({ localStorageBackups: {} });
    }
    if (!result.cookieAccounts) {
      chrome.storage.local.set({ cookieAccounts: {} });
    }
  });
});

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStorageData') {
    handleStorageRequest(request, sender, sendResponse);
    return true;
  }
  
  // 处理配置文件相关请求
  if (request.action === 'profileOperation') {
    handleProfileOperation(request, sender, sendResponse);
    return true;
  }
});

// 处理配置文件操作
async function handleProfileOperation(request, sender, sendResponse) {
  try {
    switch (request.operation) {
      case 'export':
        // 导出配置文件
        const data = await chrome.storage.local.get(['profiles', 'localStorageBackups', 'cookieAccounts']);
        sendResponse({success: true, data: data});
        break;
      case 'import':
        // 导入配置文件
        await chrome.storage.local.set(request.data);
        sendResponse({success: true});
        break;
    }
  } catch (error) {
    sendResponse({success: false, error: error.message});
  }
}

// 原有的处理函数保持不变
async function handleStorageRequest(request, sender, sendResponse) {
  try {
    const tab = sender.tab;
    if (!tab) {
      sendResponse({error: 'No tab found'});
      return;
    }

    switch (request.type) {
      case 'localStorage':
      case 'sessionStorage':
        break;
      case 'cookies':
        const cookies = await chrome.cookies.getAll({url: tab.url});
        sendResponse({data: cookies});
        break;
      case 'indexedDB':
        break;
    }
  } catch (error) {
    sendResponse({error: error.message});
  }
}

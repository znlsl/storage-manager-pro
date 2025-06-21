// Content script用于与页面交互
console.log('Storage Manager Pro content script loaded');

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getIndexedDBInfo') {
    getIndexedDBInfo().then(info => {
      sendResponse({data: info});
    }).catch(error => {
      sendResponse({error: error.message});
    });
    return true;
  }
});

// 获取IndexedDB信息
async function getIndexedDBInfo() {
  try {
    const databases = await indexedDB.databases();
    const dbInfo = [];
    
    for (const db of databases) {
      const info = await getDatabaseInfo(db.name);
      if (info) {
        dbInfo.push(info);
      }
    }
    
    return dbInfo;
  } catch (error) {
    console.error('Error getting IndexedDB info:', error);
    return [];
  }
}

// 获取单个数据库信息
async function getDatabaseInfo(dbName) {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const stores = [];
      
      for (const storeName of db.objectStoreNames) {
        stores.push({
          name: storeName,
          keyPath: null,
          autoIncrement: false
        });
      }
      
      const info = {
        name: dbName,
        version: db.version,
        stores: stores
      };
      
      db.close();
      resolve(info);
    };
    
    request.onerror = () => {
      resolve(null);
    };
  });
}

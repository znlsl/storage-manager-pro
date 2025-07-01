// 初始化脚本 - 处理页面加载和错误处理
// 这个文件替代了原来的内联脚本，符合 CSP 要求

/**
 * 应用加载完成后隐藏初始加载界面
 */
const hideInitialLoading = (): void => {
  setTimeout(() => {
    document.body.classList.add('app-loaded');
  }, 100);
};

/**
 * 全局错误处理
 */
const setupErrorHandling = (): void => {
  // 处理 JavaScript 错误
  window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);

    // 可以在这里添加错误上报逻辑
    if (event.error?.message?.includes('React')) {
      console.error('React error detected. This might be due to component initialization issues.');
    }
  });

  // 处理未捕获的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // 可以在这里添加错误上报逻辑
    if (event.reason?.message?.includes('i18next')) {
      console.error('i18next error detected. This might be due to initialization issues.');
    }
  });
};

/**
 * 初始化应用
 */
const initializeApp = (): void => {
  // 设置错误处理
  setupErrorHandling();

  // 监听页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideInitialLoading);
  } else {
    hideInitialLoading();
  }

  // 监听窗口加载完成
  window.addEventListener('load', hideInitialLoading);
};

// 立即执行初始化
initializeApp();

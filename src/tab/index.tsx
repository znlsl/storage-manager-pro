// Tab 页面入口文件
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppService } from '../services/app.service';
import '../styles/globals.scss';

// 初始化应用
const initializeApp = async (): Promise<void> => {
  try {
    // 初始化所有应用服务
    console.log('Initializing app services...');
    await AppService.initialize();
    console.log('App services initialized successfully');

    // 获取 DOM 容器
    const container = document.getElementById('root');
    if (!container) {
      console.error('Root container not found');
      return;
    }

    // 创建 React 根节点并渲染应用
    console.log('Creating React root...');
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);

    // 显示错误信息给用户
    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
          color: #ef4444;
        ">
          <h2>应用初始化失败</h2>
          <p>请刷新页面重试，或检查控制台错误信息</p>
          <pre style="
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #374151;
          ">${error instanceof Error ? error.message : String(error)}</pre>
        </div>
      `;
    }
  }
};

// 等待 DOM 加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

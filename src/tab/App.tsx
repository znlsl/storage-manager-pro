import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useToast, setGlobalToastInstance } from '../hooks/useToast';
import { Header } from '../components/common/Header';
import { Tabs, TabType } from '../components/common/Tabs';
import { StorageManager } from '../components/storage/StorageManager';
import { ToastContainer } from '../components/common/Toast';

const App: React.FC = () => {
  const { effectiveTheme, isLoading: themeLoading } = useTheme();
  const { t, isLoading: langLoading } = useLanguage();
  const toastState = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('localStorage');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // 设置全局Toast实例
    setGlobalToastInstance(toastState);
  }, [toastState]);

  useEffect(() => {
    // 等待所有服务初始化完成
    const checkReady = () => {
      if (!themeLoading && !langLoading) {
        setAppReady(true);
      }
    };

    checkReady();
  }, [themeLoading, langLoading]);

  const handleDomainChange = (domain: string) => {
    setCurrentDomain(domain);
  };

  const handleProfileLoad = (profileData: any) => {
    // 处理配置文件加载逻辑
    console.log('Loading profile:', profileData);
    // 这里可以根据配置文件数据恢复相应的存储数据
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  if (!appReady) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('loading') || '正在初始化应用...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app theme-${effectiveTheme}`}>
      <div className="container">
        <div className="scroll-container">
          <Header
            currentDomain={currentDomain}
            onDomainChange={handleDomainChange}
            onProfileLoad={handleProfileLoad}
          />

          <Tabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <StorageManager
            activeTab={activeTab}
            currentDomain={currentDomain}
          />
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        toasts={toastState.toasts}
        onRemove={toastState.removeToast}
      />
    </div>
  );
};

export default App;

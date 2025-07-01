import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

export type TabType = 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB';

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs: { key: TabType; label: string }[] = [
    { key: 'localStorage', label: t('tab_localStorage') },
    { key: 'sessionStorage', label: t('tab_sessionStorage') },
    { key: 'cookies', label: t('tab_cookies') },
    { key: 'indexedDB', label: t('tab_indexedDB') },
  ];

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

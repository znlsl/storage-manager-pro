import React from 'react';
import { TabType } from '../common/Tabs';
import { LocalStoragePanel } from './LocalStoragePanel';
import { SessionStoragePanel } from './SessionStoragePanel';
import { CookiesPanel } from './CookiesPanel';
import { IndexedDBPanel } from './IndexedDBPanel';

interface StorageManagerProps {
  activeTab: TabType;
  currentDomain: string;
}

export const StorageManager: React.FC<StorageManagerProps> = ({
  activeTab,
  currentDomain,
}) => {
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'localStorage':
        return <LocalStoragePanel currentDomain={currentDomain} />;
      case 'sessionStorage':
        return <SessionStoragePanel currentDomain={currentDomain} />;
      case 'cookies':
        return <CookiesPanel currentDomain={currentDomain} />;
      case 'indexedDB':
        return <IndexedDBPanel currentDomain={currentDomain} />;
      default:
        return null;
    }
  };

  return (
    <div className="tab-content">
      {renderActivePanel()}
    </div>
  );
};

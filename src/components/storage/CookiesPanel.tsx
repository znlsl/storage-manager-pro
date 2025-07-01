import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { CookieService } from '../../services/cookie.service';
import { CookieItem } from '../../types/storage.types';
import { StorageToolbar } from './StorageToolbar';
import { StorageList } from './StorageList';
import { CookieModal } from '../modals/CookieModal';
import { AccountModal } from '../modals/AccountModal';
import { CustomAlert } from '../common/CustomAlert';
import { CustomConfirm } from '../common/CustomConfirm';

interface CookiesPanelProps {
  currentDomain: string;
}

export const CookiesPanel: React.FC<CookiesPanelProps> = ({
  currentDomain,
}) => {
  const { t } = useLanguage();
  const { alertState, showAlert, hideAlert, confirmState, showConfirm, hideConfirm } = useCustomDialog();
  const [items, setItems] = useState<CookieItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CookieItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CookieItem | null>(null);
  const [accountMode, setAccountMode] = useState<'save' | 'switch'>('save');

  useEffect(() => {
    if (currentDomain) {
      loadItems();
    }
  }, [currentDomain]);

  const loadItems = useCallback(async () => {
    if (!currentDomain) {
      return;
    }

    setLoading(true);
    try {
      const cookies = await CookieService.getCookies(currentDomain);
      setItems(cookies);
    } catch (error) {
      console.error('Failed to load cookies:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentDomain]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, caseSensitive]);

  // 监听Cookie变化事件
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'COOKIE_CHANGED' && message.payload) {
        const { domain } = message.payload;
        // 如果变化的Cookie属于当前域名，刷新数据
        if (currentDomain && (
          domain === currentDomain ||
          domain === `.${currentDomain}` ||
          currentDomain.endsWith(domain.replace(/^\./, ''))
        )) {
          console.log('Cookie changed for current domain, refreshing...');
          loadItems();
        }
      }
    };

    // 添加消息监听器
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage);

      // 清理函数
      return () => {
        if (chrome.runtime && chrome.runtime.onMessage) {
          chrome.runtime.onMessage.removeListener(handleMessage);
        }
      };
    }
  }, [currentDomain, loadItems]);

  const filterItems = () => {
    if (!searchTerm) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => {
        const searchText = caseSensitive ? searchTerm : searchTerm.toLowerCase();
        const nameText = caseSensitive ? item.name : item.name.toLowerCase();
        const valueText = caseSensitive ? item.value : item.value.toLowerCase();
        const domainText = caseSensitive ? item.domain : item.domain.toLowerCase();

        return nameText.includes(searchText) ||
               valueText.includes(searchText) ||
               domainText.includes(searchText);
      });
      setFilteredItems(filtered);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowEditModal(true);
  };

  const handleEdit = (item: CookieItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (name: string) => {
    if (!currentDomain) {
      return;
    }

    await showConfirm(
      t('confirm_delete_cookie', { name }),
      async () => {
        try {
          await CookieService.deleteCookie(currentDomain, name);
          await loadItems();
        } catch (error) {
          console.error('Failed to delete cookie:', error);
          showAlert(t('delete_failed'), { type: 'error' });
        }
      },
      { type: 'danger' },
    );
  };

  const handleClear = async () => {
    if (!currentDomain) {
      return;
    }

    await showConfirm(
      t('confirm_clear_all'),
      async () => {
        try {
          await CookieService.clearCookies(currentDomain);
          await loadItems();
        } catch (error) {
          console.error('Failed to clear cookies:', error);
          showAlert(t('clear_failed'), { type: 'error' });
        }
      },
      { type: 'danger' },
    );
  };

  const handleSave = async (cookieData: Partial<CookieItem>) => {
    if (!currentDomain) {
      return;
    }

    try {
      // CookieService.setCookie需要name、value、domain都在cookie对象中
      const cookieToSave = {
        ...cookieData,
        name: cookieData.name || '',
        value: cookieData.value || '',
        domain: cookieData.domain || currentDomain,
      };

      await CookieService.setCookie(cookieToSave);
      await loadItems();
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save cookie:', error);
    }
  };

  const handleSaveAccount = () => {
    setAccountMode('save');
    setShowAccountModal(true);
  };

  const handleSwitchAccount = () => {
    setAccountMode('switch');
    setShowAccountModal(true);
  };

  const handleAccountComplete = () => {
    setShowAccountModal(false);
    if (accountMode === 'switch') {
      loadItems();
    }
  };

  const toolbarActions = [
    {
      key: 'add',
      label: t('add_cookie'),
      className: 'btn btn-primary',
      onClick: handleAdd,
    },
    {
      key: 'clear',
      label: t('clear_all'),
      className: 'btn btn-danger',
      onClick: handleClear,
    },
    {
      key: 'saveAccount',
      label: t('save_account'),
      className: 'btn btn-info',
      onClick: handleSaveAccount,
    },
    {
      key: 'switchAccount',
      label: t('switch_account'),
      className: 'btn btn-success',
      onClick: handleSwitchAccount,
    },
  ];

  return (
    <div className="tab-panel active">
      <StorageToolbar
        actions={toolbarActions}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('search_placeholder')}
        caseSensitive={caseSensitive}
        onCaseSensitiveChange={setCaseSensitive}
        showSearchOptions={true}
      />

      <StorageList
        items={filteredItems}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage={currentDomain ? t('no_cookies') : t('select_domain_first')}
        type="cookie"
        searchTerm={searchTerm}
        caseSensitive={caseSensitive}
      />

      {/* Modals */}
      {showEditModal && (
        <CookieModal
          cookie={editingItem}
          currentDomain={currentDomain}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}

      {showAccountModal && (
        <AccountModal
          mode={accountMode}
          currentDomain={currentDomain}
          onClose={() => setShowAccountModal(false)}
          onComplete={handleAccountComplete}
        />
      )}

      {/* Custom Dialogs */}
      <CustomAlert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
      />

      <CustomConfirm
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm || (() => {})}
        onCancel={confirmState.onCancel || hideConfirm}
      />
    </div>
  );
};

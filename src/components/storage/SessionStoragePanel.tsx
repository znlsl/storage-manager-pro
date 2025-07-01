import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { StorageService } from '../../services/storage.service';
import { StorageItem } from '../../types/storage.types';
import { StorageToolbar } from './StorageToolbar';
import { StorageList } from './StorageList';
import { StorageItemModal } from '../modals/StorageItemModal';
import { EncodingToolModal } from '../modals/EncodingToolModal';
import { CustomAlert } from '../common/CustomAlert';
import { CustomConfirm } from '../common/CustomConfirm';

interface SessionStoragePanelProps {
  currentDomain: string;
}

export const SessionStoragePanel: React.FC<SessionStoragePanelProps> = ({
  currentDomain,
}) => {
  const { t } = useLanguage();
  const { alertState, showAlert, hideAlert, confirmState, showConfirm, hideConfirm } = useCustomDialog();
  const [items, setItems] = useState<StorageItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StorageItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEncodingTool, setShowEncodingTool] = useState(false);
  const [editingItem, setEditingItem] = useState<StorageItem | null>(null);

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
      const storageItems = await StorageService.getSessionStorage(currentDomain);
      setItems(storageItems);
    } catch (error) {
      console.error('Failed to load sessionStorage:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentDomain]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, caseSensitive]);

  // 监听Storage变化事件
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'STORAGE_CHANGED' && message.payload) {
        const { storageArea, domain } = message.payload;
        // 如果变化的Storage是sessionStorage且属于当前域名，刷新数据
        if (storageArea === 'sessionStorage' && currentDomain && domain === currentDomain) {
          console.log('SessionStorage changed for current domain, refreshing...');
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
        const keyText = caseSensitive ? item.key : item.key.toLowerCase();
        const valueText = caseSensitive ? item.value : item.value.toLowerCase();

        return keyText.includes(searchText) || valueText.includes(searchText);
      });
      setFilteredItems(filtered);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowEditModal(true);
  };

  const handleEdit = (item: StorageItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (key: string) => {
    if (!currentDomain) {
      return;
    }

    await showConfirm(
      t('confirm_delete_item', { key }),
      async () => {
        try {
          const result = await StorageService.deleteSessionStorageItem(key, currentDomain);
          if (result.success) {
            await loadItems();
          } else {
            showAlert(result.error || t('delete_failed'), { type: 'error' });
          }
        } catch (error) {
          console.error('Failed to delete item:', error);
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
          await StorageService.clearSessionStorage(currentDomain);
          await loadItems();
        } catch (error) {
          console.error('Failed to clear sessionStorage:', error);
          showAlert(t('clear_failed'), { type: 'error' });
        }
      },
      { type: 'danger' },
    );
  };

  const handleSave = async (key: string, value: string) => {
    if (!currentDomain) {
      return;
    }

    try {
      const result = await StorageService.setSessionStorageItem(key, value, currentDomain);
      if (result.success) {
        await loadItems();
        setShowEditModal(false);
      } else {
        showAlert(result.error || t('save_failed'), { type: 'error' });
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      showAlert(t('save_failed'), { type: 'error' });
    }
  };

  const toolbarActions = [
    {
      key: 'add',
      label: t('add_item'),
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
      key: 'encoding-tool',
      label: t('encoding_tool'),
      className: 'btn btn-secondary',
      onClick: () => setShowEncodingTool(true),
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
        emptyMessage={currentDomain ? t('no_sessionStorage_items') : t('select_domain_first')}
        searchTerm={searchTerm}
        caseSensitive={caseSensitive}
      />

      {/* Modals */}
      {showEditModal && (
        <StorageItemModal
          item={editingItem}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
          title={editingItem ? t('edit_item') : t('add_item')}
        />
      )}

      {showEncodingTool && (
        <EncodingToolModal
          onClose={() => setShowEncodingTool(false)}
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

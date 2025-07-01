import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { toast } from '../../hooks/useToast';
import { HighlightText } from '../common/HighlightText';
import { StorageItem, CookieItem } from '../../types/storage.types';
import { UtilsService } from '../../services/utils.service';

interface StorageListProps {
  items: (StorageItem | CookieItem)[];
  loading: boolean;
  onEdit: (item: any) => void;
  onDelete: (key: string) => void;
  emptyMessage: string;
  type?: 'storage' | 'cookie';
  searchTerm?: string;
  caseSensitive?: boolean;
}

export const StorageList: React.FC<StorageListProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
  emptyMessage,
  type = 'storage',
  searchTerm = '',
  caseSensitive = false,
}) => {
  const { t } = useLanguage();

  const handleCopyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('copied_to_clipboard'));
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error(t('copy_error'));
    }
  };

  const formatValue = (value: string, maxLength: number = 100) => {
    if (value.length <= maxLength) {
      return value;
    }
    return value.substring(0, maxLength) + '...';
  };

  const formatSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isValidJSON = (str: string) => {
    if (!str || str.trim() === '') {
      return false;
    }

    try {
      const parsed = JSON.parse(str);
      // 只有当解析结果是对象或数组时，才认为是需要格式化的JSON
      // 排除简单的字符串、数字、布尔值、null等
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  };

  const renderStorageItem = (item: StorageItem, index: number) => (
    <div key={`${item.key}-${index}`} className="storage-item">
      <div className="item-info">
        <div className="item-key">
          <HighlightText
            text={item.key}
            searchTerm={searchTerm}
            caseSensitive={caseSensitive}
          />
        </div>
        <div className="item-value">
          {isValidJSON(item.value) && (
            <span className="json-indicator">JSON</span>
          )}
          <HighlightText
            text={formatValue(item.value)}
            searchTerm={searchTerm}
            caseSensitive={caseSensitive}
          />
        </div>
        <div className="item-meta">
          <span className="item-size">{formatSize(item.size)}</span>
        </div>
      </div>
      <div className="item-actions">
        <button
          className="btn btn-sm btn-secondary copy-btn"
          onClick={() => handleCopyValue(item.value)}
          title={t('copy_to_clipboard')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
        </button>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onEdit(item)}
          title={t('edit')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => onDelete(item.key)}
          title={t('delete')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
  );

  const renderCookieItem = (item: CookieItem, index: number) => (
    <div key={`${item.name}-${index}`} className="storage-item cookie-item">
      <div className="item-info">
        <div className="item-key">
          <HighlightText
            text={item.name}
            searchTerm={searchTerm}
            caseSensitive={caseSensitive}
          />
        </div>
        <div className="item-value">
          <HighlightText
            text={formatValue(item.value)}
            searchTerm={searchTerm}
            caseSensitive={caseSensitive}
          />
        </div>
        <div className="item-meta">
          <span className="item-domain">{item.domain}</span>
          <span className="item-path">{item.path}</span>
          {item.expires && (
            <span className="item-expires">
              {t('expires')}: {UtilsService.formatDate(new Date(item.expires * 1000))}
            </span>
          )}
          <span className="item-size">{formatSize(item.size)}</span>
          {item.secure && <span className="cookie-flag">Secure</span>}
          {item.httpOnly && <span className="cookie-flag">HttpOnly</span>}
          {item.sameSite && <span className="cookie-flag">{item.sameSite}</span>}
        </div>
      </div>
      <div className="item-actions">
        <button
          className="btn btn-sm btn-secondary copy-btn"
          onClick={() => handleCopyValue(item.value)}
          title={t('copy_to_clipboard')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
        </button>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onEdit(item)}
          title={t('edit')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => onDelete(item.name)}
          title={t('delete')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="storage-list">
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="storage-list">
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="storage-list">
      {items.map((item, index) =>
        type === 'cookie'
          ? renderCookieItem(item as CookieItem, index)
          : renderStorageItem(item as StorageItem, index),
      )}
    </div>
  );
};

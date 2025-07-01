import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { toast } from '../../hooks/useToast';
import { IndexedDBService, IndexedDBInfo } from '../../services/indexeddb.service';
import { StorageToolbar } from './StorageToolbar';
import { CustomAlert } from '../common/CustomAlert';
import { CustomConfirm } from '../common/CustomConfirm';

interface IndexedDBPanelProps {
  currentDomain: string;
}

export const IndexedDBPanel: React.FC<IndexedDBPanelProps> = ({
  currentDomain,
}) => {
  const { t } = useLanguage();
  const { alertState, hideAlert, confirmState, showConfirm, hideConfirm } = useCustomDialog();
  const [databases, setDatabases] = useState<IndexedDBInfo[]>([]);
  const [filteredDatabases, setFilteredDatabases] = useState<IndexedDBInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentDomain) {
      loadDatabases();
    }
  }, [currentDomain]);

  useEffect(() => {
    filterDatabases();
  }, [databases, searchTerm, caseSensitive]);

  const loadDatabases = async () => {
    if (!currentDomain) {
      console.log('[IndexedDB Panel] No domain selected');
      setDatabases([]);
      return;
    }

    setLoading(true);
    setLoadingProgress(0);

    try {
      console.log(`[IndexedDB Panel] Loading databases for domain: ${currentDomain}`);

      // 使用新的IndexedDB服务，传递currentDomain参数
      setLoadingProgress(25);
      const dbList = await IndexedDBService.getDatabases(currentDomain);
      setLoadingProgress(75);

      // 样本数据已经在getDatabases中获取了，不需要额外加载
      setDatabases(dbList);
      setLoadingProgress(100);

      console.log(`[IndexedDB Panel] Loaded ${dbList.length} databases for domain: ${currentDomain}`);
    } catch (error) {
      console.error('Failed to load IndexedDB:', error);
      toast.error(t('refresh_indexeddb_failed'));
      setDatabases([]);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const filterDatabases = () => {
    if (!searchTerm) {
      setFilteredDatabases(databases);
    } else {
      const filtered = databases.filter(db => {
        const searchText = caseSensitive ? searchTerm : searchTerm.toLowerCase();
        const dbName = caseSensitive ? db.name : db.name.toLowerCase();

        return dbName.includes(searchText) ||
          db.objectStores.some(store => {
            const storeName = caseSensitive ? store.name : store.name.toLowerCase();
            return storeName.includes(searchText);
          });
      });
      setFilteredDatabases(filtered);
    }
  };

  const handleRefresh = () => {
    loadDatabases();
  };

  const handleDeleteDatabase = async (dbName: string) => {
    await showConfirm(
      t('confirm_delete_database', { name: dbName }),
      async () => {
        try {
          setLoading(true);
          const success = await IndexedDBService.deleteDatabase(dbName, currentDomain);

          if (success) {
            toast.success(t('database_deleted', `Database "${dbName}" deleted successfully`));
            await loadDatabases();
          } else {
            toast.error(t('delete_database_error'));
          }
        } catch (error) {
          console.error('Failed to delete database:', error);
          toast.error(t('delete_database_error'));
        } finally {
          setLoading(false);
        }
      },
      { type: 'danger' },
    );
  };

  const toggleDatabaseExpansion = (dbName: string) => {
    const newExpanded = new Set(expandedDatabases);
    if (newExpanded.has(dbName)) {
      newExpanded.delete(dbName);
    } else {
      newExpanded.add(dbName);
    }
    setExpandedDatabases(newExpanded);
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

  const renderSampleDataItem = (item: any, _itemIndex: number) => {
    // 检查是否是大数据项
    if (item && item._isLargeData) {
      return (
        <div className="large-data-item">
          <div className="large-data-header">
            <span className="large-data-badge">⚠️ {t('large_data')}</span>
            <span className="large-data-size">{item._sizeFormatted}</span>
            <span className="large-data-record">#{item._recordIndex}</span>
          </div>

          {item._keys && (
            <div className="large-data-keys">
              <strong>{t('fields')}:</strong> {item._keys.join(', ')}
            </div>
          )}

          <div className="large-data-preview">
            <strong>{t('preview')}:</strong>
            <div className="preview-content">
              {item._preview && typeof item._preview === 'object' ? (
                <pre>{JSON.stringify(item._preview, null, 2)}</pre>
              ) : (
                <pre>{String(item._preview)}</pre>
              )}
            </div>
          </div>

          <div className="large-data-warning">
            <small>
              💡 {t('large_data_warning', 'Full data hidden to prevent memory issues. Original size: ' + item._sizeFormatted)}
            </small>
          </div>
        </div>
      );
    }

    // 检查是否有错误
    if (item && item._error) {
      return (
        <div className="error-data-item">
          <div className="error-header">
            <span className="error-badge">❌ {t('error')}</span>
            <span className="error-record">#{item._recordIndex}</span>
          </div>
          <div className="error-message">{item._error}</div>
        </div>
      );
    }

    // 普通数据项
    const displayItem = item && item._isLargeData === false ?
      (() => {
        const { _isLargeData, _originalSize, _recordIndex, ...cleanItem } = item;
        return cleanItem;
      })() : item;

    return (
      <div className="normal-data-item">
        {item && item._originalSize && (
          <div className="data-size-info">
            <small>📊 {formatSize(item._originalSize)} • #{item._recordIndex}</small>
          </div>
        )}
        <pre>{JSON.stringify(displayItem, null, 2)}</pre>
      </div>
    );
  };

  const toolbarActions = [
    {
      key: 'refresh',
      label: t('refresh'),
      className: 'btn btn-primary',
      onClick: handleRefresh,
    },
  ];

  const renderDatabase = (db: IndexedDBInfo, index: number) => {
    const isExpanded = expandedDatabases.has(db.name);

    return (
      <div key={`${db.name}-${index}`} className="indexeddb-item">
        <div className="db-header">
          <div className="db-info">
            <div className="db-name-row">
              <button
                className="expand-btn"
                onClick={() => toggleDatabaseExpansion(db.name)}
                title={isExpanded ? t('collapse') : t('expand')}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className={isExpanded ? 'expanded' : ''}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <h4 className="db-name">{db.name}</h4>
            </div>
            <div className="db-meta">
              <span className="db-version">{t('version')}: {db.version}</span>
              <span className="db-stores">{t('stores')}: {db.objectStores.length}</span>
              <span className="db-size">{formatSize(db.size || 0)}</span>
            </div>
          </div>
          <div className="db-actions">
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteDatabase(db.name)}
              title={t('delete_database')}
              disabled={loading}
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

        {/* 可展开的对象存储详情 */}
        {isExpanded && db.objectStores.length > 0 && (
          <div className="object-stores">
            <h5>{t('object_stores')} ({db.objectStores.length}):</h5>
            {db.objectStores.map((store, storeIndex) => (
              <div key={`${store.name}-${storeIndex}`} className="object-store">
                <div className="store-info">
                  <span className="store-name">{store.name}</span>
                  <span className="store-count">{store.recordCount || 0} {t('records')}</span>
                  {store.keyPath && (
                    <span className="store-keypath">{t('key_path')}: {JSON.stringify(store.keyPath)}</span>
                  )}
                  {store.autoIncrement && (
                    <span className="store-auto-increment">{t('auto_increment')}</span>
                  )}
                </div>

                {/* 索引信息 */}
                {store.indexes.length > 0 && (
                  <div className="store-indexes">
                    <span className="indexes-label">{t('indexes')} ({store.indexes.length}):</span>
                    {store.indexes.map((index, indexIndex) => (
                      <div key={indexIndex} className="index-item">
                        <span className="index-name">{index.name}</span>
                        <span className="index-keypath">({JSON.stringify(index.keyPath)})</span>
                        {index.unique && <span className="index-unique">{t('unique')}</span>}
                        {index.multiEntry && <span className="index-multi">{t('multi_entry')}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* 样本数据 */}
                {store.sampleData && store.sampleData.length > 0 && (
                  <div className="store-sample-data">
                    <h6>{t('sample_data')} ({store.sampleData.length}/{store.recordCount}):</h6>
                    <div className="sample-data-list">
                      {store.sampleData.slice(0, 5).map((item, itemIndex) => (
                        <div key={itemIndex} className="sample-data-item">
                          {renderSampleDataItem(item, itemIndex)}
                        </div>
                      ))}
                      {store.sampleData.length > 5 && (
                        <div className="sample-data-more">
                          {t('and_more', `... and ${store.sampleData.length - 5} more items`)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tab-panel active">
        <StorageToolbar
          actions={toolbarActions}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('search_placeholder')}
        />

        <div className="storage-list">
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>{t('loading_indexeddb')}</p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* 加载进度指示器 */}
      {loading && (
        <div className="loading-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="progress-text">
            {t('loading_indexeddb_data')} {Math.round(loadingProgress)}%
          </p>
        </div>
      )}

      <div className="storage-list indexeddb-list">
        {filteredDatabases.length === 0 ? (
          <div className="empty-state">
            <p>{currentDomain ? t('no_indexeddb') : t('select_domain_first')}</p>
          </div>
        ) : (
          filteredDatabases.map(renderDatabase)
        )}
      </div>

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

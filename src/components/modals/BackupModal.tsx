import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { StorageService } from '../../services/storage.service';
import { BaseModal } from './BaseModal';
import { CustomAlert } from '../common/CustomAlert';
import { CustomConfirm } from '../common/CustomConfirm';

interface BackupModalProps {
  mode: 'backup' | 'restore';
  storageType: 'localStorage';
  currentDomain: string;
  onClose: () => void;
  onComplete: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  mode,
  storageType,
  currentDomain,
  onClose,
  onComplete,
}) => {
  const { t } = useLanguage();
  const { alertState, showAlert, hideAlert, confirmState, showConfirm, hideConfirm } = useCustomDialog();
  const [backups, setBackups] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (mode === 'restore') {
      loadBackups();
    }
  }, [mode]);

  const loadBackups = async () => {
    setLoading(true);
    try {
      // 简化的备份列表获取
      const result = await chrome.storage.local.get([`backups_${storageType}`]);
      const backupList = result[`backups_${storageType}`] || [];
      setBackups(backupList);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBackup = async () => {
    if (!formData.name.trim()) {
      showAlert(t('backup_name_required'), { type: 'warning' });
      return;
    }

    if (!currentDomain) {
      showAlert(t('domain_required_for_backup'), { type: 'warning' });
      return;
    }

    setProcessing(true);
    try {
      const data = await StorageService.getLocalStorage(currentDomain);
      const backupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        domain: currentDomain,
        timestamp: new Date().toISOString(),
        data: data,
      };

      // 简化的备份保存
      const result = await chrome.storage.local.get([`backups_${storageType}`]);
      const backups = result[`backups_${storageType}`] || [];
      backups.push(backupData);
      await chrome.storage.local.set({ [`backups_${storageType}`]: backups });
      onComplete();
    } catch (error) {
      console.error('Failed to create backup:', error);
      showAlert(t('backup_error'), { type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRestore = async (backupName: string) => {
    if (!currentDomain) {
      showAlert(t('domain_required_for_restore'), { type: 'warning' });
      return;
    }

    await showConfirm(
      t('confirm_restore_backup', { name: backupName }),
      async () => {
        await performRestore(backupName);
      },
      { type: 'warning' },
    );
  };

  const performRestore = async (backupName: string) => {

    setProcessing(true);
    try {
      // 简化的备份加载
      const result = await chrome.storage.local.get([`backups_${storageType}`]);
      const backups = result[`backups_${storageType}`] || [];
      const backupData = backups.find((b: any) => b.name === backupName);

      // 清空当前数据
      await StorageService.clearLocalStorage(currentDomain);

      // 恢复数据
      for (const [key, value] of Object.entries(backupData.data)) {
        await StorageService.setLocalStorageItem(key, value as string, currentDomain);
      }

      onComplete();
    } catch (error) {
      console.error('Failed to restore backup:', error);
      showAlert(t('restore_error'), { type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteBackup = async (backupName: string) => {
    await showConfirm(
      t('confirm_delete_backup', { name: backupName }),
      async () => {
        try {
          // 简化的备份删除
          const result = await chrome.storage.local.get([`backups_${storageType}`]);
          const backups = result[`backups_${storageType}`] || [];
          const filteredBackups = backups.filter((b: any) => b.name !== backupName);
          await chrome.storage.local.set({ [`backups_${storageType}`]: filteredBackups });
          await loadBackups();
        } catch (error) {
          console.error('Failed to delete backup:', error);
          showAlert(t('delete_backup_error'), { type: 'error' });
        }
      },
      { type: 'danger' },
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose} disabled={processing}>
        {t('cancel')}
      </button>
      {mode === 'backup' && (
        <button className="btn btn-primary" onClick={handleBackup} disabled={processing}>
          {processing ? t('creating_backup') : t('confirm')}
        </button>
      )}
    </>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={mode === 'backup' ? t('backup_title') : t('restore_title')}
      footer={footer}
    >
      {mode === 'backup' ? (
        <>
          <div className="form-group">
            <label htmlFor="backupName">{t('backup_name')}</label>
            <input
              type="text"
              id="backupName"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('backup_name_placeholder')}
              disabled={processing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="backupDescription">{t('backup_description')}</label>
            <textarea
              id="backupDescription"
              name="description"
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('backup_description_placeholder')}
              disabled={processing}
            />
          </div>

          {currentDomain && (
            <div className="form-group">
              <label>{t('current_domain')}</label>
              <div className="domain-display">{currentDomain}</div>
            </div>
          )}
        </>
      ) : (
        <>
          <h4>{t('select_backup')}</h4>
          {loading ? (
            <div className="loading-indicator">
              <p>{t('loading')}</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="empty-state">
              <p>{t('no_backups')}</p>
            </div>
          ) : (
            <div className="backup-list">
              {backups.map((backup, index) => (
                <div key={index} className="backup-item">
                  <div className="backup-info">
                    <div className="backup-name">{backup.name}</div>
                    <div className="backup-meta">
                      <span className="backup-date">
                        {formatDate(backup.timestamp)}
                      </span>
                      <span className="backup-domain">
                        {t('domain')}: {backup.domain}
                      </span>
                    </div>
                    {backup.description && (
                      <div className="backup-description">{backup.description}</div>
                    )}
                  </div>
                  <div className="backup-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleRestore(backup.name)}
                      disabled={processing}
                    >
                      {t('restore')}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteBackup(backup.name)}
                      disabled={processing}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
    </BaseModal>
  );
};

import React, { useState, useRef } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { toast } from '../../hooks/useToast';
import { ProfileManager } from '../../services/profile.service';
import { BaseModal } from './BaseModal';
import { CustomAlert } from '../common/CustomAlert';
import { CustomConfirm } from '../common/CustomConfirm';

interface ProfileImportExportModalProps {
  mode: 'import' | 'export';
  profileName?: string; // 用于单个配置文件导出
  onClose: () => void;
  onComplete?: () => void;
}

export const ProfileImportExportModal: React.FC<ProfileImportExportModalProps> = ({
  mode,
  profileName,
  onClose,
  onComplete,
}) => {
  const { t } = useLanguage();
  const { alertState, showAlert, hideAlert, confirmState, showConfirm, hideConfirm } = useCustomDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [processing, setProcessing] = useState(false);
  const [importData, setImportData] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const handleExportSingle = async () => {
    if (!profileName) {
      return;
    }

    setProcessing(true);
    try {
      const jsonData = await ProfileManager.exportProfile(profileName);
      if (jsonData) {
        ProfileManager.downloadProfile(profileName, jsonData);
        toast.success(t('export_success'));
        onComplete?.();
        onClose();
      } else {
        showAlert(t('export_failed', 'Export failed'), { type: 'error' });
      }
    } catch (error) {
      console.error('Failed to export profile:', error);
      showAlert(t('export_failed', 'Export failed'), { type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportAll = async () => {
    setProcessing(true);
    try {
      const jsonData = await ProfileManager.exportAllProfiles();
      if (jsonData) {
        ProfileManager.downloadAllProfiles(jsonData);
        toast.success(t('export_success'));
        onComplete?.();
        onClose();
      } else {
        showAlert(t('export_failed', 'Export failed'), { type: 'error' });
      }
    } catch (error) {
      console.error('Failed to export all profiles:', error);
      showAlert(t('export_failed', 'Export failed'), { type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showAlert(t('invalid_file_type', 'Please select a JSON file'), { type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.onerror = () => {
      showAlert(t('file_read_error', 'Failed to read file'), { type: 'error' });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      showAlert(t('no_import_data', 'Please select a file to import'), { type: 'warning' });
      return;
    }

    setProcessing(true);
    try {
      const result = await ProfileManager.importProfile(importData, overwriteExisting);

      if (result.success) {
        toast.success(result.message);
        onComplete?.();
        onClose();
      } else {
        if (result.profileName && !overwriteExisting) {
          // 存在冲突，询问是否覆盖
          await showConfirm(
            t('profile_exists_overwrite', 'Profile already exists. Do you want to overwrite it?'),
            async () => {
              setOverwriteExisting(true);
              const retryResult = await ProfileManager.importProfile(importData, true);
              if (retryResult.success) {
                toast.success(retryResult.message);
                onComplete?.();
                onClose();
              } else {
                showAlert(retryResult.message, { type: 'error' });
              }
            },
            { type: 'warning' },
          );
        } else {
          showAlert(result.message, { type: 'error' });
        }
      }
    } catch (error) {
      console.error('Failed to import profile:', error);
      showAlert(t('import_failed'), { type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImportData(e.target.value);
  };

  const renderExportMode = () => (
    <div className="profile-export">
      <div className="export-options">
        <p className="export-description">
          {profileName
            ? t('export_single_description', `Export profile "${profileName}" to a JSON file`)
            : t('export_all_description', 'Export all profiles to a JSON file')
          }
        </p>

        <div className="export-actions">
          {profileName ? (
            <button
              className="btn btn-primary"
              onClick={handleExportSingle}
              disabled={processing}
            >
              {processing ? t('exporting', 'Exporting...') : t('export_profile', 'Export Profile')}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleExportAll}
              disabled={processing}
            >
              {processing ? t('exporting', 'Exporting...') : t('export_all_profiles', 'Export All Profiles')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderImportMode = () => (
    <div className="profile-import">
      <div className="import-options">
        <p className="import-description">
          {t('import_description', 'Import profiles from a JSON file. You can import single profiles or multiple profiles at once.')}
        </p>

        <div className="file-input-section">
          <button
            className="btn btn-secondary"
            onClick={handleFileSelect}
            disabled={processing}
          >
            {t('select_file', 'Select File')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="import-options-section">
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="overwriteExisting"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
              disabled={processing}
            />
            <label htmlFor="overwriteExisting">
              {t('overwrite_existing', 'Overwrite existing profiles')}
            </label>
          </div>
        </div>

        {importData && (
          <div className="import-preview">
            <label htmlFor="importData">{t('import_data_preview', 'Import Data Preview')}</label>
            <textarea
              id="importData"
              className="form-control import-textarea"
              rows={10}
              value={importData}
              onChange={handleTextareaChange}
              placeholder={t('import_data_placeholder', 'JSON data will appear here...')}
              disabled={processing}
            />
          </div>
        )}
      </div>
    </div>
  );

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose} disabled={processing}>
        {t('cancel')}
      </button>
      {mode === 'import' && importData && (
        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={processing}
        >
          {processing ? t('importing', 'Importing...') : t('import')}
        </button>
      )}
    </>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={mode === 'export'
        ? (profileName ? t('export_profile') : t('export_all_profiles'))
        : t('import_profiles', 'Import Profiles')
      }
      footer={footer}
      maxWidth="600px"
    >
      {mode === 'export' ? renderExportMode() : renderImportMode()}

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
        onConfirm={confirmState.onConfirm || (() => {})}
        onCancel={hideConfirm}
      />
    </BaseModal>
  );
};

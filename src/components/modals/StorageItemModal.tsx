import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { StorageItem } from '../../types/storage.types';
import { UtilsService } from '../../services/utils.service';
import { BaseModal } from './BaseModal';
import { CustomAlert } from '../common/CustomAlert';
import { CustomConfirm } from '../common/CustomConfirm';

interface StorageItemModalProps {
  item: StorageItem | null;
  onClose: () => void;
  onSave: (key: string, value: string) => void;
  title: string;
}

export const StorageItemModal: React.FC<StorageItemModalProps> = ({
  item,
  onClose,
  onSave,
  title,
}) => {
  const { t } = useLanguage();
  const { alertState, showAlert, hideAlert, confirmState, showConfirm, hideConfirm } = useCustomDialog();
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 保存初始值用于比较
  const [initialKey, setInitialKey] = useState('');
  const [initialValue, setInitialValue] = useState('');

  useEffect(() => {
    if (item) {
      setKey(item.key);
      setValue(item.value);
      setInitialKey(item.key);
      setInitialValue(item.value);
    } else {
      setKey('');
      setValue('');
      setInitialKey('');
      setInitialValue('');
    }
    setHasUnsavedChanges(false);
  }, [item]);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setKey(newKey);
    // 检查是否真的有变化
    setHasUnsavedChanges(newKey !== initialKey || value !== initialValue);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    // 检查是否真的有变化
    setHasUnsavedChanges(key !== initialKey || newValue !== initialValue);
  };

  const handleSave = () => {
    if (!key.trim()) {
      showAlert(t('key_required'), { type: 'warning' });
      return;
    }
    onSave(key, value);
    setHasUnsavedChanges(false);
  };

  const handleClose = async () => {
    if (hasUnsavedChanges) {
      await showConfirm(
        t('unsaved_changes_warning'),
        () => {
          onClose();
        },
        { type: 'warning' },
      );
    } else {
      onClose();
    }
  };

  const handleFormatJSON = () => {
    try {
      const formatted = UtilsService.formatJSON(value);
      setValue(formatted);
      // 检查格式化后的值是否与初始值不同
      setHasUnsavedChanges(key !== initialKey || formatted !== initialValue);
    } catch (error) {
      showAlert(t('invalid_json'), { type: 'error' });
    }
  };

  const handleMinifyJSON = () => {
    try {
      const minified = UtilsService.minifyJSON(value);
      setValue(minified);
      // 检查压缩后的值是否与初始值不同
      setHasUnsavedChanges(key !== initialKey || minified !== initialValue);
    } catch (error) {
      showAlert(t('invalid_json'), { type: 'error' });
    }
  };

  const handleBase64Encode = () => {
    try {
      const encoded = UtilsService.encodeBase64(value);
      setValue(encoded);
      // 检查编码后的值是否与初始值不同
      setHasUnsavedChanges(key !== initialKey || encoded !== initialValue);
    } catch (error) {
      alert(t('encoding_error'));
    }
  };

  const handleBase64Decode = () => {
    try {
      const decoded = UtilsService.decodeBase64(value);
      setValue(decoded);
      // 检查解码后的值是否与初始值不同
      setHasUnsavedChanges(key !== initialKey || decoded !== initialValue);
    } catch (error) {
      alert(t('decoding_error'));
    }
  };

  const handleUTF8Encode = () => {
    try {
      const encoded = UtilsService.encodeUTF8(value);
      setValue(encoded);
      // 检查编码后的值是否与初始值不同
      setHasUnsavedChanges(key !== initialKey || encoded !== initialValue);
    } catch (error) {
      alert(t('encoding_error'));
    }
  };

  const handleUTF8Decode = () => {
    try {
      const decoded = UtilsService.decodeUTF8(value);
      setValue(decoded);
      // 检查解码后的值是否与初始值不同
      setHasUnsavedChanges(key !== initialKey || decoded !== initialValue);
    } catch (error) {
      alert(t('decoding_error'));
    }
  };

  const handleMaximize = () => {
    setIsFullscreen(true);
  };

  const handleFullscreenCancel = () => {
    setIsFullscreen(false);
  };

  const handleFullscreenSave = () => {
    setIsFullscreen(false);
    handleSave();
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

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={handleClose}>
        {t('cancel')}
      </button>
      <button className="btn btn-primary" onClick={handleSave}>
        {t('save')}
      </button>
    </>
  );

  if (isFullscreen) {
    return (
      <div className="fullscreen-editor">
        <div className="fullscreen-content">
          <div className="fullscreen-header">
            <h3>{title} - {key || t('new_item')}</h3>
            <div className="fullscreen-format-buttons">
              {isValidJSON(value) && (
                <>
                  <button
                    type="button"
                    className="format-btn"
                    onClick={handleFormatJSON}
                  >
                    {t('format_json')}
                  </button>
                  <button
                    type="button"
                    className="format-btn"
                    onClick={handleMinifyJSON}
                  >
                    {t('minify_json')}
                  </button>
                </>
              )}
              <button
                type="button"
                className="format-btn"
                onClick={handleBase64Encode}
              >
                {t('encode_base64')}
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={handleBase64Decode}
              >
                {t('decode_base64')}
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={handleUTF8Encode}
              >
                {t('encode_utf8')}
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={handleUTF8Decode}
              >
                {t('decode_utf8')}
              </button>
            </div>
          </div>

          <div className="fullscreen-body">
            <textarea
              value={value}
              onChange={handleValueChange}
              className="fullscreen-textarea"
              placeholder={t('enter_value')}
            />
          </div>

          <div className="fullscreen-buttons">
            <button className="btn btn-secondary" onClick={handleFullscreenCancel}>
              {t('cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleFullscreenSave}>
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BaseModal
      isOpen={true}
      onClose={handleClose}
      title={title}
      footer={footer}
    >
      <div className="form-group">
        <label htmlFor="editKey">{t('key_label')}</label>
        <input
          type="text"
          id="editKey"
          className="form-control"
          value={key}
          onChange={handleKeyChange}
          placeholder={t('enter_key')}
        />
      </div>

      <div className="form-group">
        <label htmlFor="editValue">{t('value_label')}</label>

        <div className="format-buttons">
          {isValidJSON(value) && (
            <>
              <button
                type="button"
                className="format-btn"
                onClick={handleFormatJSON}
              >
                {t('format_json')}
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={handleMinifyJSON}
              >
                {t('minify_json')}
              </button>
            </>
          )}
          <button
            type="button"
            className="format-btn"
            onClick={handleBase64Encode}
          >
            {t('encode_base64')}
          </button>
          <button
            type="button"
            className="format-btn"
            onClick={handleBase64Decode}
          >
            {t('decode_base64')}
          </button>
          <button
            type="button"
            className="format-btn"
            onClick={handleUTF8Encode}
          >
            {t('encode_utf8')}
          </button>
          <button
            type="button"
            className="format-btn"
            onClick={handleUTF8Decode}
          >
            {t('decode_utf8')}
          </button>
        </div>

        <div className="value-input-container">
          <textarea
            id="editValue"
            className="form-control"
            rows={10}
            value={value}
            onChange={handleValueChange}
            placeholder={t('enter_value')}
          />
          <button
            type="button"
            className="maximize-btn"
            onClick={handleMaximize}
            title={t('maximize_editor')}
          >
            ⛶
          </button>
        </div>
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
    </BaseModal>
  );
};

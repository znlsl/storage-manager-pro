import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { BaseModal } from '../modals/BaseModal';

interface CustomConfirmProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

export const CustomConfirm: React.FC<CustomConfirmProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  type = 'info',
}) => {
  const { t } = useLanguage();

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="confirm-icon warning">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'danger':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="confirm-icon danger">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="confirm-icon info">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        );
    }
  };

  const getTitle = () => {
    if (title) {
      return title;
    }
    return t('confirm');
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn btn-danger';
      case 'warning':
        return 'btn btn-warning';
      default:
        return 'btn btn-primary';
    }
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onCancel}>
        {cancelText || t('cancel')}
      </button>
      <button className={getConfirmButtonClass()} onClick={onConfirm}>
        {confirmText || t('confirm')}
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={getTitle()}
      footer={footer}
      maxWidth="400px"
      className={`custom-confirm confirm-${type}`}
    >
      <div className="confirm-content">
        {getIcon()}
        <div className="confirm-message">
          {message}
        </div>
      </div>
    </BaseModal>
  );
};

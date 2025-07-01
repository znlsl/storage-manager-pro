import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { BaseModal } from '../modals/BaseModal';

interface CustomAlertProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  isOpen,
  title,
  message,
  onClose,
  type = 'info',
}) => {
  const { t } = useLanguage();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="alert-icon success">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        );
      case 'warning':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="alert-icon warning">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="alert-icon error">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="alert-icon info">
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

    switch (type) {
      case 'success':
        return t('success');
      case 'warning':
        return t('warning');
      case 'error':
        return t('error');
      default:
        return t('info');
    }
  };

  const footer = (
    <button className="btn btn-primary" onClick={onClose}>
      {t('confirm')}
    </button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      footer={footer}
      maxWidth="400px"
      className={`custom-alert alert-${type}`}
    >
      <div className="alert-content">
        {getIcon()}
        <div className="alert-message">
          {message}
        </div>
      </div>
    </BaseModal>
  );
};

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 3000,
  onClose,
}) => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 延迟显示动画
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // 自动关闭
    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // 等待退出动画完成
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  const getTitle = () => {
    if (title) {
      return title;
    }

    switch (type) {
      case 'success':
        return t('success');
      case 'error':
        return t('error');
      case 'warning':
        return t('warning');
      case 'info':
        return t('info');
      default:
        return '';
    }
  };

  return (
    <div
      className={`toast toast-${type} ${isVisible ? 'toast-visible' : ''} ${isLeaving ? 'toast-leaving' : ''}`}
      onClick={handleClose}
    >
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        <div className="toast-body">
          <div className="toast-title">{getTitle()}</div>
          <div className="toast-message">{message}</div>
        </div>
        <button
          className="toast-close"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

import { useState, useCallback } from 'react';
import { ToastProps } from '../components/common/Toast';

export interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  duration?: number;
}

export interface ToastState {
  toasts: ToastProps[];
  showToast: (message: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  showSuccess: (message: string, title?: string) => string;
  showError: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
}

export const useToast = (): ToastState => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((message: string, options: ToastOptions = {}): string => {
    const id = generateId();
    const toast: ToastProps = {
      id,
      type: options.type || 'info',
      title: options.title,
      message,
      duration: options.duration || 3000,
      onClose: removeToast,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, [generateId]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback((message: string, title?: string): string => {
    return showToast(message, { type: 'success', title });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string): string => {
    return showToast(message, { type: 'error', title });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string): string => {
    return showToast(message, { type: 'warning', title });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string): string => {
    return showToast(message, { type: 'info', title });
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// 全局Toast实例（可选）
let globalToastInstance: ToastState | null = null;

export const setGlobalToastInstance = (instance: ToastState) => {
  globalToastInstance = instance;
};

export const toast = {
  success: (message: string, title?: string) => {
    if (globalToastInstance) {
      return globalToastInstance.showSuccess(message, title);
    }
    console.warn('Global toast instance not set');
    return '';
  },
  error: (message: string, title?: string) => {
    if (globalToastInstance) {
      return globalToastInstance.showError(message, title);
    }
    console.warn('Global toast instance not set');
    return '';
  },
  warning: (message: string, title?: string) => {
    if (globalToastInstance) {
      return globalToastInstance.showWarning(message, title);
    }
    console.warn('Global toast instance not set');
    return '';
  },
  info: (message: string, title?: string) => {
    if (globalToastInstance) {
      return globalToastInstance.showInfo(message, title);
    }
    console.warn('Global toast instance not set');
    return '';
  },
};

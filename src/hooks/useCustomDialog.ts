import { useState, useCallback } from 'react';

interface AlertOptions {
  title?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

interface AlertState {
  isOpen: boolean;
  message: string;
  title?: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ConfirmState {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type: 'info' | 'warning' | 'danger';
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const useCustomDialog = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const showAlert = useCallback((message: string, options: AlertOptions = {}) => {
    setAlertState({
      isOpen: true,
      message,
      title: options.title,
      type: options.type || 'info',
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    options: ConfirmOptions = {},
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        title: options.title,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        type: options.type || 'info',
        onConfirm: () => {
          onConfirm();
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    // Alert
    alertState,
    showAlert,
    hideAlert,

    // Confirm
    confirmState,
    showConfirm,
    hideConfirm,
  };
};

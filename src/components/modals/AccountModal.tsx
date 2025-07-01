import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { CookieAccountManager } from '../../services/profile.service';
import { CookieService } from '../../services/cookie.service';
import { BaseModal } from './BaseModal';
import { CustomAlert } from '../common/CustomAlert';
import { CustomConfirm } from '../common/CustomConfirm';

interface AccountModalProps {
  mode: 'save' | 'switch';
  currentDomain: string;
  onClose: () => void;
  onComplete: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  mode,
  currentDomain,
  onClose,
  onComplete,
}) => {
  const { t } = useLanguage();
  const { alertState, showAlert, hideAlert, confirmState, showConfirm, hideConfirm } = useCustomDialog();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (mode === 'switch') {
      loadAccounts();
    }
  }, [mode]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const accountList = await CookieAccountManager.getAccountList(currentDomain);
      setAccounts(accountList);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAccount = async () => {
    if (!formData.name.trim()) {
      showAlert(t('account_name_required'), { type: 'warning' });
      return;
    }

    if (!currentDomain) {
      showAlert(t('domain_required_for_account'), { type: 'warning' });
      return;
    }

    // 检查账户名称是否已存在
    try {
      const existingAccounts = await CookieAccountManager.getAccountList(currentDomain);
      const duplicateAccount = existingAccounts.find(account => account.name === formData.name.trim());

      if (duplicateAccount) {
        // 生成唯一名称建议
        const baseName = formData.name.trim();
        let counter = 1;
        let suggestedName = `${baseName} (${counter})`;

        while (existingAccounts.find(account => account.name === suggestedName)) {
          counter++;
          suggestedName = `${baseName} (${counter})`;
        }

        await showConfirm(
          t('account_name_exists', { name: formData.name.trim(), suggested: suggestedName }),
          () => {
            setFormData(prev => ({ ...prev, name: suggestedName }));
          },
          {
            type: 'warning',
            confirmText: t('use_suggested_name'),
            cancelText: t('keep_current_name')
          }
        );
        return;
      }
    } catch (error) {
      console.error('Failed to check existing accounts:', error);
    }

    setProcessing(true);
    try {
      const cookies = await CookieService.getCookies(currentDomain);
      const accountData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        domain: currentDomain,
        timestamp: new Date().toISOString(),
        cookies: cookies,
      };

      await CookieAccountManager.saveAccount(currentDomain, accountData.name, accountData.description, accountData.cookies);
      onComplete();
    } catch (error) {
      console.error('Failed to save account:', error);
      showAlert(t('save_account_error'), { type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    if (!currentDomain) {
      showAlert(t('domain_required_for_switch'), { type: 'warning' });
      return;
    }

    // 找到对应的账户以获取名称用于确认对话框
    const account = accounts.find(acc => acc.id === accountId);
    const accountName = account?.name || 'Unknown';

    await showConfirm(
      t('confirm_switch_account', { name: accountName }),
      async () => {
        setProcessing(true);
        try {
          console.log(`[Cookie Account Switch] Starting account switch for domain: ${currentDomain}, accountId: ${accountId}`);

          const accountData = await CookieAccountManager.loadAccount(currentDomain, accountId);
          console.log('[Cookie Account Switch] Loaded account data:', {
            cookieCount: accountData?.length || 0,
            currentDomain,
            accountId,
          });

          // 清空当前cookies
          await CookieService.clearCookies(currentDomain);
          console.log(`[Cookie Account Switch] Cleared existing cookies for domain: ${currentDomain}`);

          // 恢复账户cookies
          if (accountData && Array.isArray(accountData)) {
            console.log(`[Cookie Account Switch] Restoring ${accountData.length} cookies...`);

            for (let i = 0; i < accountData.length; i++) {
              const cookie = accountData[i];

              // 保持Cookie的原始domain，不要强制覆盖为currentDomain
              const cookieToRestore = {
                ...cookie,
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain || currentDomain, // 只在没有domain时才使用currentDomain
              };

              console.log(`[Cookie Account Switch] Restoring cookie ${i + 1}/${accountData.length}:`, {
                name: cookie.name,
                originalDomain: cookie.domain,
                finalDomain: cookieToRestore.domain,
                currentDomain,
                domainChanged: cookie.domain !== cookieToRestore.domain,
              });

              const success = await CookieService.setCookie(cookieToRestore);

              if (!success) {
                console.warn(`[Cookie Account Switch] Failed to restore cookie: ${cookie.name} for domain: ${cookieToRestore.domain}`);
              }
            }

            console.log('[Cookie Account Switch] Cookie restoration completed');
          }

          onComplete();
        } catch (error) {
          console.error('[Cookie Account Switch] Failed to switch account:', error);
          showAlert(t('switch_account_error'), { type: 'error' });
        } finally {
          setProcessing(false);
        }
      },
      { type: 'warning' },
    );
  };

  const handleDeleteAccount = async (accountId: string) => {
    // 找到对应的账户以获取名称用于确认对话框
    const account = accounts.find(acc => acc.id === accountId);
    const accountName = account?.name || 'Unknown';

    await showConfirm(
      t('confirm_delete_account', { name: accountName }),
      async () => {
        try {
          await CookieAccountManager.deleteAccount(currentDomain, accountId);
          await loadAccounts();
        } catch (error) {
          console.error('Failed to delete account:', error);
          showAlert(t('delete_account_error'), { type: 'error' });
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
      {mode === 'save' && (
        <button className="btn btn-primary" onClick={handleSaveAccount} disabled={processing}>
          {processing ? t('saving_account') : t('save')}
        </button>
      )}
    </>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={mode === 'save' ? t('save_account') : t('switch_account')}
      footer={footer}
    >
      {mode === 'save' ? (
        <>
          <div className="form-group">
            <label htmlFor="accountName">{t('account_name')}</label>
            <input
              type="text"
              id="accountName"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('account_name_placeholder')}
              disabled={processing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="accountDescription">{t('account_description')}</label>
            <textarea
              id="accountDescription"
              name="description"
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('account_description_placeholder')}
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
          <h4>{t('select_account')}</h4>
          {loading ? (
            <div className="loading-indicator">
              <p>{t('loading')}</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="empty-state">
              <p>{t('no_accounts')}</p>
            </div>
          ) : (
            <div className="account-list">
              {accounts.map((account, index) => (
                <div key={index} className="account-item">
                  <div className="account-info">
                    <div className="account-name">{account.name}</div>
                    <div className="account-meta">
                      <span className="account-date">
                        {formatDate(account.timestamp)}
                      </span>
                      <span className="account-domain">
                        {t('domain')}: {account.domain}
                      </span>
                      <span className="account-cookies">
                        {account.cookieCount || 0} {t('cookies')}
                      </span>
                    </div>
                    {account.description && (
                      <div className="account-description">{account.description}</div>
                    )}
                  </div>
                  <div className="account-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleSwitchAccount(account.id)}
                      disabled={processing}
                    >
                      {t('switch')}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteAccount(account.id)}
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

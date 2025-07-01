import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { toast } from '../../hooks/useToast';
import { ProfileManager, Profile } from '../../services/profile.service';
import { BaseModal } from './BaseModal';
import { CustomAlert } from '../common/CustomAlert';
import { CustomConfirm } from '../common/CustomConfirm';

interface GlobalProfileModalProps {
  mode: 'create' | 'manage';
  onClose: () => void;
  onComplete?: () => void;
}

export const GlobalProfileModal: React.FC<GlobalProfileModalProps> = ({
  mode,
  onClose,
  onComplete,
}) => {
  const { t } = useLanguage();
  const { alertState, showAlert, hideAlert, confirmState, showConfirm, hideConfirm } = useCustomDialog();

  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 创建模式的状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    includeDomains: [] as string[],
    includeAccounts: true,
    includeBackups: true,
  });

  const [availableDomains, setAvailableDomains] = useState<string[]>([]);

  useEffect(() => {
    loadProfiles();
    if (mode === 'create') {
      loadAvailableDomains();
    }
  }, [mode]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const globalProfiles = await ProfileManager.getGlobalProfiles();
      setProfiles(globalProfiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      showAlert(t('load_profiles_error'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDomains = async () => {
    try {
      // 获取所有可用的域名
      const tabs = await chrome.tabs.query({});
      const domains = new Set<string>();

      tabs.forEach(tab => {
        if (tab.url) {
          try {
            const url = new URL(tab.url);
            if (url.hostname && !url.hostname.startsWith('chrome')) {
              domains.add(url.hostname);
            }
          } catch (error) {
            // 忽略无效URL
          }
        }
      });

      setAvailableDomains(Array.from(domains));
    } catch (error) {
      console.error('Failed to load available domains:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDomainToggle = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      includeDomains: prev.includeDomains.includes(domain)
        ? prev.includeDomains.filter(d => d !== domain)
        : [...prev.includeDomains, domain],
    }));
  };

  const handleCreateProfile = async () => {
    if (!formData.name.trim()) {
      showAlert(t('enter_profile_name'), { type: 'warning' });
      return;
    }

    if (profiles[formData.name]) {
      await showConfirm(
        t('confirm_save_profile', { name: formData.name }),
        async () => {
          await createProfile(true);
        },
        { type: 'warning' },
      );
    } else {
      await createProfile(false);
    }
  };

  const createProfile = async (overwrite: boolean) => {
    setProcessing(true);
    try {
      // 创建全局配置文件
      const profile = await ProfileManager.createGlobalProfile(
        formData.name.trim(),
        formData.description.trim(),
        formData.includeDomains,
      );

      // 如果需要包含账户数据，收集账户信息
      if (formData.includeAccounts) {
        // 这里需要实现账户数据收集逻辑
        console.log('Collecting account data...');
      }

      // 如果需要包含备份数据，收集备份信息
      if (formData.includeBackups) {
        // 这里需要实现备份数据收集逻辑
        console.log('Collecting backup data...');
      }

      const success = await ProfileManager.saveGlobalProfile(profile, overwrite);

      if (success) {
        toast.success(t('profile_saved'));
        onComplete?.();
        onClose();
      } else {
        showAlert(t('save_profile_error'), { type: 'error' });
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      showAlert(t('save_profile_error'), { type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleLoadProfile = async (profileName: string) => {
    await showConfirm(
      t('confirm_load_profile'),
      async () => {
        setProcessing(true);
        try {
          const success = await ProfileManager.loadGlobalProfile(profileName);

          if (success) {
            toast.success(t('profile_loaded'));
            onComplete?.();
            onClose();
          } else {
            showAlert(t('load_profile_error'), { type: 'error' });
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          showAlert(t('load_profile_error'), { type: 'error' });
        } finally {
          setProcessing(false);
        }
      },
      { type: 'warning' },
    );
  };

  const handleDeleteProfile = async (profileName: string) => {
    await showConfirm(
      t('confirm_delete_profile'),
      async () => {
        setProcessing(true);
        try {
          const success = await ProfileManager.deleteGlobalProfile(profileName);

          if (success) {
            toast.success(t('profile_deleted'));
            await loadProfiles();
          } else {
            showAlert(t('delete_profile_error'), { type: 'error' });
          }
        } catch (error) {
          console.error('Failed to delete profile:', error);
          showAlert(t('delete_profile_error'), { type: 'error' });
        } finally {
          setProcessing(false);
        }
      },
      { type: 'danger' },
    );
  };

  const renderCreateMode = () => (
    <div className="global-profile-create">
      <div className="form-group">
        <label htmlFor="profileName">{t('profile_name')}</label>
        <input
          type="text"
          id="profileName"
          name="name"
          className="form-control"
          value={formData.name}
          onChange={handleInputChange}
          placeholder={t('profile_name_placeholder')}
          disabled={processing}
        />
      </div>

      <div className="form-group">
        <label htmlFor="profileDescription">{t('profile_description', 'Profile Description')}</label>
        <textarea
          id="profileDescription"
          name="description"
          className="form-control"
          rows={3}
          value={formData.description}
          onChange={handleInputChange}
          placeholder={t('profile_description_placeholder', 'Optional profile description')}
          disabled={processing}
        />
      </div>

      <div className="form-group">
        <label>{t('include_domains', 'Include Domains')}</label>
        <div className="domain-list">
          {availableDomains.map(domain => (
            <div key={domain} className="domain-item">
              <input
                type="checkbox"
                id={`domain-${domain}`}
                checked={formData.includeDomains.includes(domain)}
                onChange={() => handleDomainToggle(domain)}
                disabled={processing}
              />
              <label htmlFor={`domain-${domain}`}>{domain}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="includeAccounts"
              checked={formData.includeAccounts}
              onChange={(e) => setFormData(prev => ({ ...prev, includeAccounts: e.target.checked }))}
              disabled={processing}
            />
            <label htmlFor="includeAccounts">{t('include_accounts', 'Include Account Data')}</label>
          </div>

          <div className="checkbox-item">
            <input
              type="checkbox"
              id="includeBackups"
              checked={formData.includeBackups}
              onChange={(e) => setFormData(prev => ({ ...prev, includeBackups: e.target.checked }))}
              disabled={processing}
            />
            <label htmlFor="includeBackups">{t('include_backups', 'Include Backup Data')}</label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderManageMode = () => (
    <div className="global-profile-manage">
      {loading ? (
        <div className="loading-state">
          <p>{t('loading_data')}</p>
        </div>
      ) : Object.keys(profiles).length === 0 ? (
        <div className="empty-state">
          <p>{t('no_profiles')}</p>
        </div>
      ) : (
        <div className="profile-list">
          {Object.values(profiles).map(profile => (
            <div key={profile.name} className="profile-item">
              <div className="profile-info">
                <h4 className="profile-name">{profile.name}</h4>
                {profile.description && (
                  <p className="profile-description">{profile.description}</p>
                )}
                <div className="profile-meta">
                  <span className="profile-version">v{profile.version}</span>
                  <span className="profile-timestamp">
                    {t('created_time')}: {new Date(profile.timestamp).toLocaleString()}
                  </span>
                </div>

                {/* 数据统计 */}
                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-label">{t('domains')}:</span>
                    <span className="stat-value">{Object.keys(profile.data.domains).length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('accounts')}:</span>
                    <span className="stat-value">{Object.keys(profile.data.accounts).length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('backups')}:</span>
                    <span className="stat-value">{Object.keys(profile.data.backups).length}</span>
                  </div>
                </div>

                {/* 域名列表 */}
                {Object.keys(profile.data.domains).length > 0 && (
                  <div className="profile-domains">
                    <span className="domains-label">{t('included_domains')}:</span>
                    <div className="domains-list">
                      {Object.keys(profile.data.domains).slice(0, 3).map(domain => (
                        <span key={domain} className="domain-tag">{domain}</span>
                      ))}
                      {Object.keys(profile.data.domains).length > 3 && (
                        <span className="domain-more">+{Object.keys(profile.data.domains).length - 3} {t('more')}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 数据详情 */}
                <div className="profile-details">
                  {Object.entries(profile.data.domains).map(([domain, domainData]) => (
                    <div key={domain} className="domain-detail">
                      <span className="domain-name">{domain}:</span>
                      <span className="data-count">
                        LS: {Object.keys(domainData.localStorage).length},
                        SS: {Object.keys(domainData.sessionStorage).length},
                        Cookies: {domainData.cookies.length}
                      </span>
                    </div>
                  )).slice(0, 2)}
                  {Object.keys(profile.data.domains).length > 2 && (
                    <div className="domain-detail">
                      <span className="more-domains">... {t('and_more')}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="profile-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleLoadProfile(profile.name)}
                  disabled={processing}
                >
                  {t('load')}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteProfile(profile.name)}
                  disabled={processing}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose} disabled={processing}>
        {t('cancel')}
      </button>
      {mode === 'create' && (
        <button
          className="btn btn-primary"
          onClick={handleCreateProfile}
          disabled={processing || !formData.name.trim()}
        >
          {processing ? t('saving') : t('save_config')}
        </button>
      )}
    </>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={mode === 'create' ? t('create_global_profile', 'Create Global Profile') : t('manage_global_profiles', 'Manage Global Profiles')}
      footer={footer}
      maxWidth="600px"
    >
      {mode === 'create' ? renderCreateMode() : renderManageMode()}

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

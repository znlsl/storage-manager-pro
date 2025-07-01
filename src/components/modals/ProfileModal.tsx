import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { ProfileService } from '../../services/profile.service';
import { BaseModal } from './BaseModal';
import { CustomAlert } from '../common/CustomAlert';
import { CustomConfirm } from '../common/CustomConfirm';

interface ProfileModalProps {
  onClose: () => void;
  onProfilesChange: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  onClose,
  onProfilesChange,
}) => {
  const { t } = useLanguage();
  const { alertState, showAlert, hideAlert, confirmState, showConfirm, hideConfirm } = useCustomDialog();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const profileList = await ProfileService.getProfileList();
      setProfiles(profileList);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileName: string) => {
    await showConfirm(
      t('confirm_delete_profile', { name: profileName }),
      async () => {
        try {
          await ProfileService.deleteProfile(profileName);
          await loadProfiles();
          onProfilesChange();
        } catch (error) {
          console.error('Failed to delete profile:', error);
          showAlert(t('delete_profile_error'), { type: 'error' });
        }
      },
      { type: 'danger' },
    );
  };

  const handleLoadProfile = async (profileName: string) => {
    try {
      await ProfileService.loadProfile(profileName);
      // 这里可以触发加载配置文件的逻辑
      showAlert(t('profile_loaded_success', { name: profileName }), { type: 'success' });
      onClose();
    } catch (error) {
      console.error('Failed to load profile:', error);
      showAlert(t('load_profile_error'), { type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const footer = (
    <button className="btn btn-secondary" onClick={onClose}>
      {t('close')}
    </button>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={t('profile_management')}
      footer={footer}
    >
      <h4>{t('existing_profiles')}</h4>

      {loading ? (
        <div className="loading-indicator">
          <p>{t('loading')}</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state">
          <p>{t('no_profiles')}</p>
        </div>
      ) : (
        <div className="profile-list">
          {profiles.map((profile, index) => (
            <div key={index} className="profile-item">
              <div className="profile-info">
                <div className="profile-name">{profile.name}</div>
                <div className="profile-meta">
                  <span className="profile-date">
                    {t('created')}: {formatDate(profile.timestamp)}
                  </span>
                  <span className="profile-domain">
                    {t('domain')}: {profile.domain}
                  </span>
                </div>
                {profile.description && (
                  <div className="profile-description">{profile.description}</div>
                )}
                <div className="profile-content">
                  {profile.includeLocalStorage && (
                    <span className="content-type">LocalStorage</span>
                  )}
                  {profile.includeCookies && (
                    <span className="content-type">Cookies</span>
                  )}
                </div>
              </div>
              <div className="profile-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleLoadProfile(profile.name)}
                  title={t('load_profile')}
                >
                  {t('load')}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteProfile(profile.name)}
                  title={t('delete_profile')}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
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

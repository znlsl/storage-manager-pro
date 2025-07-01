import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { ChromeService } from '../../services/chrome.service';
import { ProfileService } from '../../services/profile.service';
import { SettingsModal } from '../modals/SettingsModal';
import { ProfileModal } from '../modals/ProfileModal';
import { SaveProfileModal } from '../modals/SaveProfileModal';
import { ManualDomainModal } from '../modals/ManualDomainModal';

interface HeaderProps {
  currentDomain: string;
  onDomainChange: (domain: string) => void;
  onProfileLoad: (profileData: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDomain,
  onDomainChange,
  onProfileLoad,
}) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [domains, setDomains] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false);
  const [showManualDomainModal, setShowManualDomainModal] = useState(false);

  useEffect(() => {
    loadDomains();
    loadProfiles();
  }, []);

  const loadDomains = async () => {
    try {
      const domainList = await ChromeService.getDomainList();
      setDomains(domainList);

      // 如果当前没有选择域名，优先选择当前活跃标签页的域名
      if (!currentDomain && domainList.length > 0) {
        const currentTabDomain = await ChromeService.getCurrentDomain();

        // 如果当前标签页的域名在列表中，优先选择它
        if (currentTabDomain && domainList.includes(currentTabDomain)) {
          onDomainChange(currentTabDomain);
        } else {
          // 否则选择第一个域名
          onDomainChange(domainList[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const profileList = await ProfileService.getProfileList();
      setProfiles(profileList);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleRefreshDomains = async () => {
    setIsRefreshing(true);
    try {
      await loadDomains();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDomainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onDomainChange(event.target.value);
  };

  const handleProfileChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const profileName = event.target.value;
    setSelectedProfile(profileName);

    if (profileName) {
      try {
        const profileData = await ProfileService.loadProfile(profileName);
        onProfileLoad(profileData);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    }
  };

  const handleManualDomain = (domain: string) => {
    if (domain && !domains.includes(domain)) {
      setDomains(prev => [domain, ...prev]);
    }
    onDomainChange(domain);
    setShowManualDomainModal(false);
  };

  const handleProfileSaved = () => {
    loadProfiles();
    setShowSaveProfileModal(false);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        );
      case 'dark':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5V3m0 18v-2M5.45 5.11L4.4 4.06m15.2 15.2l-1.05-1.05M3 12H1m22 0h-2M5.45 18.89l-1.05 1.05m15.2-15.2l-1.05 1.05M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"/>
            <path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"/>
          </svg>
        );
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case 'light': return t('light_theme');
      case 'dark': return t('dark_theme');
      default: return t('auto_theme');
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-top">
          <h1>{t('title')}</h1>
          <div className="header-controls">
            <button
              className="settings-btn"
              onClick={() => setShowSettings(true)}
              title={t('settings')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </button>
            <button className="theme-btn" onClick={toggleTheme}>
              {getThemeIcon()}
              <span>{getThemeText()}</span>
            </button>
          </div>
        </div>

        <div className="domain-selector">
          <div className="domain-selector-header">
            <span className="domain-label">{t('domain_label')}</span>
            <div className="domain-controls">
              <button
                className={`domain-btn ${isRefreshing ? 'loading' : ''}`}
                onClick={handleRefreshDomains}
                disabled={isRefreshing}
                title={t('refresh_domains')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </button>
              <button
                className="domain-btn"
                onClick={() => setShowManualDomainModal(true)}
                title={t('manual_domain')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
          </div>
          <select
            className="domain-dropdown"
            value={currentDomain}
            onChange={handleDomainChange}
          >
            {domains.length === 0 ? (
              <option value="">{t('loading_domains')}</option>
            ) : (
              <>
                <option value="">{t('select_domain')}</option>
                {domains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="profile-selector">
          <select
            className="profile-dropdown"
            value={selectedProfile}
            onChange={handleProfileChange}
          >
            <option value="">{t('select_profile')}</option>
            {profiles.map(profile => (
              <option key={profile.name} value={profile.name}>
                {profile.name}
              </option>
            ))}
          </select>
          <button
            className="profile-btn"
            onClick={() => setShowSaveProfileModal(true)}
            title={t('save_profile')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </button>
          <button
            className="profile-btn"
            onClick={() => setShowProfileModal(true)}
            title={t('manage_profiles')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5V3m0 18v-2M5.45 5.11L4.4 4.06m15.2 15.2l-1.05-1.05M3 12H1m22 0h-2M5.45 18.89l-1.05 1.05m15.2-15.2l-1.05 1.05M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"/>
              <path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          onProfilesChange={loadProfiles}
        />
      )}
      {showSaveProfileModal && (
        <SaveProfileModal
          onClose={() => setShowSaveProfileModal(false)}
          onSaved={handleProfileSaved}
          currentDomain={currentDomain}
        />
      )}
      {showManualDomainModal && (
        <ManualDomainModal
          onClose={() => setShowManualDomainModal(false)}
          onConfirm={handleManualDomain}
        />
      )}
    </>
  );
};

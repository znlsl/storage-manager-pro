import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { BaseModal } from './BaseModal';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState({
    windowMode: 'tab',
    popupWidth: 1200,
    popupHeight: 800,
    language: language,
    theme: theme,
  });

  useEffect(() => {
    // 加载当前设置
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get(['windowMode', 'popupWidth', 'popupHeight']);
        setSettings(prev => ({
          ...prev,
          windowMode: result.windowMode || 'tab',
          popupWidth: result.popupWidth || 1200,
          popupHeight: result.popupHeight || 800,
          language: language,
          theme: theme,
        }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [language, theme]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'popupWidth' || name === 'popupHeight' ? parseInt(value) : value,
    }));
  };

  const handleSave = async () => {
    try {
      // 保存窗口设置
      await chrome.storage.local.set({
        windowMode: settings.windowMode,
        popupWidth: settings.popupWidth,
        popupHeight: settings.popupHeight,
      });

      // 应用语言设置
      if (settings.language !== language) {
        await setLanguage(settings.language);
      }

      // 应用主题设置
      if (settings.theme !== theme) {
        setTheme(settings.theme);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(t('save_settings_error'));
    }
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        {t('cancel')}
      </button>
      <button className="btn btn-primary" onClick={handleSave}>
        {t('save')}
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={t('settings')}
      footer={footer}
      maxWidth="500px"
    >
      <div className="setting-group">
        <label htmlFor="windowModeSelect">{t('window_mode')}:</label>
        <select
          id="windowModeSelect"
          name="windowMode"
          className="form-control"
          value={settings.windowMode}
          onChange={handleInputChange}
        >
          <option value="popup">{t('popup_window')}</option>
          <option value="tab">{t('tab_mode')}</option>
        </select>
        <small className="setting-description">{t('window_mode_desc')}</small>
      </div>

      {settings.windowMode === 'popup' && (
        <div className="setting-group">
          <label>{t('popup_size')}:</label>
          <div className="size-inputs">
            <div className="input-group">
              <label htmlFor="popupWidth">{t('width')}:</label>
              <input
                type="number"
                id="popupWidth"
                name="popupWidth"
                min="800"
                max="1920"
                className="form-control"
                value={settings.popupWidth}
                onChange={handleInputChange}
              />
              <span>px</span>
            </div>
            <div className="input-group">
              <label htmlFor="popupHeight">{t('height')}:</label>
              <input
                type="number"
                id="popupHeight"
                name="popupHeight"
                min="600"
                max="1080"
                className="form-control"
                value={settings.popupHeight}
                onChange={handleInputChange}
              />
              <span>px</span>
            </div>
          </div>
          <small className="setting-description">{t('popup_size_desc')}</small>
        </div>
      )}

      <div className="setting-group">
        <label htmlFor="languageSelect">{t('language')}:</label>
        <select
          id="languageSelect"
          name="language"
          className="form-control"
          value={settings.language}
          onChange={handleInputChange}
        >
          <option value="zh">{t('chinese')}</option>
          <option value="en">{t('english')}</option>
        </select>
        <small className="setting-description">{t('language_desc')}</small>
      </div>

      <div className="setting-group">
        <label htmlFor="themeSelect">{t('theme')}:</label>
        <select
          id="themeSelect"
          name="theme"
          className="form-control"
          value={settings.theme}
          onChange={handleInputChange}
        >
          <option value="light">{t('light_theme')}</option>
          <option value="dark">{t('dark_theme')}</option>
          <option value="auto">{t('auto_theme')}</option>
        </select>
        <small className="setting-description">{t('theme_desc')}</small>
      </div>
    </BaseModal>
  );
};

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { CookieItem } from '../../types/storage.types';
import { UtilsService } from '../../services/utils.service';
import { BaseModal } from './BaseModal';

interface CookieModalProps {
  cookie: CookieItem | null;
  currentDomain: string;
  onClose: () => void;
  onSave: (cookieData: Partial<CookieItem>) => void;
}

export const CookieModal: React.FC<CookieModalProps> = ({
  cookie,
  currentDomain,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    domain: UtilsService.extractCookieDomain(currentDomain),
    path: '/',
    expires: '',
    secure: false,
    httpOnly: false,
    sameSite: '' as 'Strict' | 'Lax' | 'None' | '',
  });

  useEffect(() => {
    if (cookie) {
      setFormData({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || '/',
        expires: cookie.expires ? new Date(cookie.expires * 1000).toISOString().slice(0, 16) : '',
        secure: cookie.secure || false,
        httpOnly: cookie.httpOnly || false,
        sameSite: (cookie.sameSite === 'no_restriction' || cookie.sameSite === 'lax' || cookie.sameSite === 'strict')
          ? (cookie.sameSite === 'no_restriction' ? '' : cookie.sameSite === 'lax' ? 'Lax' : 'Strict')
          : (cookie.sameSite || ''),
      });
    } else {
      // 新建 Cookie 时，使用智能域名设置
      setFormData({
        name: '',
        value: '',
        domain: UtilsService.extractCookieDomain(currentDomain),
        path: '/',
        expires: '',
        secure: false,
        httpOnly: false,
        sameSite: '',
      });
    }
  }, [cookie, currentDomain]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert(t('cookie_name_required'));
      return;
    }

    const cookieData: Partial<CookieItem> = {
      name: formData.name,
      value: formData.value,
      domain: formData.domain,
      path: formData.path,
      secure: formData.secure,
      httpOnly: formData.httpOnly,
      sameSite: formData.sameSite || undefined,
    };

    if (formData.expires) {
      cookieData.expires = Math.floor(new Date(formData.expires).getTime() / 1000);
    }

    onSave(cookieData);
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
      title={cookie ? t('edit_cookie') : t('add_cookie')}
      footer={footer}
    >
      <div className="form-group">
        <label htmlFor="cookieName">{t('cookie_name')}</label>
        <input
          type="text"
          id="cookieName"
          name="name"
          className="form-control"
          value={formData.name}
          onChange={handleInputChange}
          placeholder={t('enter_cookie_name')}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cookieValue">{t('cookie_value')}</label>
        <textarea
          id="cookieValue"
          name="value"
          className="form-control"
          rows={3}
          value={formData.value}
          onChange={handleInputChange}
          placeholder={t('enter_cookie_value')}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cookieDomain">{t('domain_field')}</label>
        <input
          type="text"
          id="cookieDomain"
          name="domain"
          className="form-control"
          value={formData.domain}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cookiePath">{t('path_field')}</label>
        <input
          type="text"
          id="cookiePath"
          name="path"
          className="form-control"
          value={formData.path}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cookieExpires">{t('expires_field')}</label>
        <input
          type="datetime-local"
          id="cookieExpires"
          name="expires"
          className="form-control"
          value={formData.expires}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="secure"
            checked={formData.secure}
            onChange={handleInputChange}
          />
          Secure
        </label>
        <label>
          <input
            type="checkbox"
            name="httpOnly"
            checked={formData.httpOnly}
            onChange={handleInputChange}
          />
          HttpOnly
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="cookieSameSite">{t('samesite_field')}</label>
        <select
          id="cookieSameSite"
          name="sameSite"
          className="form-control"
          value={formData.sameSite}
          onChange={handleInputChange}
        >
          <option value="">{t('samesite_none')}</option>
          <option value="Lax">{t('samesite_lax')}</option>
          <option value="Strict">{t('samesite_strict')}</option>
          <option value="None">{t('samesite_none_value')}</option>
        </select>
      </div>
    </BaseModal>
  );
};

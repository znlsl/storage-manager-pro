import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { BaseModal } from './BaseModal';

interface ManualDomainModalProps {
  onClose: () => void;
  onConfirm: (domain: string) => void;
}

export const ManualDomainModal: React.FC<ManualDomainModalProps> = ({
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [domain, setDomain] = useState('');

  const handleConfirm = () => {
    const trimmedDomain = domain.trim();
    if (!trimmedDomain) {
      alert(t('domain_required'));
      return;
    }

    // 简单的域名格式验证
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(trimmedDomain)) {
      alert(t('invalid_domain_format'));
      return;
    }

    onConfirm(trimmedDomain);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        {t('cancel')}
      </button>
      <button className="btn btn-primary" onClick={handleConfirm}>
        {t('confirm')}
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={t('manual_domain_title')}
      footer={footer}
      maxWidth="500px"
    >
      <div className="form-group">
        <label htmlFor="manualDomainInput">{t('domain_input_label')}</label>
        <input
          type="text"
          id="manualDomainInput"
          className="form-control"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('domain_input_placeholder')}
          autoFocus
        />
        <small className="form-text">{t('domain_input_help')}</small>
      </div>
    </BaseModal>
  );
};

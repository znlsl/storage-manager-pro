import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface ToolbarAction {
  key: string;
  label: string;
  className: string;
  onClick: () => void;
  disabled?: boolean;
}

interface StorageToolbarProps {
  actions: ToolbarAction[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  caseSensitive?: boolean;
  onCaseSensitiveChange?: (value: boolean) => void;
  showSearchOptions?: boolean;
}

export const StorageToolbar: React.FC<StorageToolbarProps> = ({
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  caseSensitive = false,
  onCaseSensitiveChange,
  showSearchOptions = true,
}) => {
  const { t } = useLanguage();
  return (
    <div className="toolbar">
      {actions.map(action => (
        <button
          key={action.key}
          className={action.className}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          <span>{action.label}</span>
        </button>
      ))}

      <div className="search-box">
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
          {searchValue && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title={t('clear')}
            >
              ×
            </button>
          )}
        </div>

        {showSearchOptions && searchValue && (
          <div className="search-options">
            <div className="search-option">
              <input
                type="checkbox"
                id="caseSensitive"
                checked={caseSensitive}
                onChange={(e) => onCaseSensitiveChange?.(e.target.checked)}
              />
              <label htmlFor="caseSensitive">
                {t('case_sensitive', 'Case Sensitive')}
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

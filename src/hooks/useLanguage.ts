// 语言管理 Hook
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Language } from '../types/common.types';
import { I18nService } from '../services/i18n.service';

export interface UseLanguageReturn {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, fallbackOrOptions?: string | Record<string, unknown>) => string;
  isLoading: boolean;
  supportedLanguages: Language[];
  getLanguageDisplayName: (language: Language) => string;
}

export function useLanguage(): UseLanguageReturn {
  const { t: i18nT } = useTranslation();
  const [language, setLanguageState] = useState<Language>(() => {
    // 获取当前语言，如果 i18next 还未初始化则返回默认值
    try {
      return I18nService.getCurrentLanguage();
    } catch {
      return 'zh';
    }
  });
  const [isLoading] = useState(false);

  useEffect(() => {
    // 设置当前语言状态
    setLanguageState(I18nService.getCurrentLanguage());

    // 监听语言变化
    const unsubscribe = I18nService.onLanguageChange((newLanguage) => {
      setLanguageState(newLanguage);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    try {
      await I18nService.setLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  };

  // 包装t函数以支持fallback参数
  const t = (key: string, fallbackOrOptions?: string | Record<string, unknown>): string => {
    if (typeof fallbackOrOptions === 'string') {
      // 如果第二个参数是字符串，作为fallback使用
      return i18nT(key, { defaultValue: fallbackOrOptions });
    } else {
      // 如果是对象或undefined，直接传递给i18nT
      return i18nT(key, fallbackOrOptions);
    }
  };

  return {
    language,
    setLanguage,
    t,
    isLoading,
    supportedLanguages: I18nService.getSupportedLanguages(),
    getLanguageDisplayName: I18nService.getLanguageDisplayName,
  };
}

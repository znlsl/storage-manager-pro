// 主题管理 Hook
import { useState, useEffect } from 'react';
import type { ThemeMode } from '../types/common.types';
import { ThemeService } from '../services/theme.service';

export interface UseThemeReturn {
  theme: ThemeMode
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: ThemeMode) => Promise<void>
  toggleTheme: () => Promise<void>
  isLoading: boolean
}

export function useTheme (): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // 获取当前主题，如果服务还未初始化则返回默认值
    try {
      return ThemeService.getCurrentTheme();
    } catch {
      return 'light';
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化主题服务
    const initializeTheme = async () => {
      try {
        await ThemeService.initialize();
        setThemeState(ThemeService.getCurrentTheme());
      } catch (error) {
        console.error('Failed to initialize theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();

    // 监听主题变化
    const unsubscribe = ThemeService.onThemeChange((newTheme) => {
      setThemeState(newTheme);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setTheme = async (newTheme: ThemeMode) => {
    try {
      await ThemeService.setTheme(newTheme);
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      await ThemeService.toggleTheme();
    } catch (error) {
      console.error('Failed to toggle theme:', error);
    }
  };

  return {
    theme,
    effectiveTheme: ThemeService.getEffectiveTheme(),
    setTheme,
    toggleTheme,
    isLoading,
  };
}

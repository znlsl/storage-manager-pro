// 存储管理 Hook
import { useState, useEffect, useCallback } from 'react';
import type { StorageItem, CookieItem } from '../types/storage.types';
import { StorageService } from '../services/storage.service';
import { CookieService } from '../services/cookie.service';

export interface UseStorageReturn {
  localStorage: StorageItem[];
  sessionStorage: StorageItem[];
  cookies: CookieItem[];
  isLoading: boolean;
  error: string | null;
  refreshLocalStorage: () => Promise<void>;
  refreshSessionStorage: () => Promise<void>;
  refreshCookies: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setLocalStorageItem: (key: string, value: string) => Promise<boolean>;
  setSessionStorageItem: (key: string, value: string) => Promise<boolean>;
  setCookie: (cookie: Partial<CookieItem> & { name: string; value: string }) => Promise<boolean>;
  deleteLocalStorageItem: (key: string) => Promise<boolean>;
  deleteSessionStorageItem: (key: string) => Promise<boolean>;
  deleteCookie: (name: string, path?: string) => Promise<boolean>;
  clearLocalStorage: () => Promise<boolean>;
  clearSessionStorage: () => Promise<boolean>;
  clearCookies: () => Promise<boolean>;
}

export function useStorage(domain: string): UseStorageReturn {
  const [localStorage, setLocalStorage] = useState<StorageItem[]>([]);
  const [sessionStorage, setSessionStorage] = useState<StorageItem[]>([]);
  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLocalStorage = useCallback(async () => {
    if (!domain) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await StorageService.getLocalStorage(domain);
      setLocalStorage(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load localStorage';
      setError(errorMessage);
      console.error('Failed to refresh localStorage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [domain]);

  const refreshSessionStorage = useCallback(async () => {
    if (!domain) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await StorageService.getSessionStorage(domain);
      setSessionStorage(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessionStorage';
      setError(errorMessage);
      console.error('Failed to refresh sessionStorage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [domain]);

  const refreshCookies = useCallback(async () => {
    if (!domain) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await CookieService.getCookies(domain);
      setCookies(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cookies';
      setError(errorMessage);
      console.error('Failed to refresh cookies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [domain]);

  const refreshAll = useCallback(async () => {
    if (!domain) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        refreshLocalStorage(),
        refreshSessionStorage(),
        refreshCookies(),
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh storage data';
      setError(errorMessage);
      console.error('Failed to refresh all storage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [domain, refreshLocalStorage, refreshSessionStorage, refreshCookies]);

  const setLocalStorageItem = useCallback(async (key: string, value: string): Promise<boolean> => {
    try {
      const result = await StorageService.setLocalStorageItem(key, value, domain);
      if (result.success) {
        await refreshLocalStorage();
        return true;
      } else {
        console.error('Failed to set localStorage item:', result.error);
        return false;
      }
    } catch (err) {
      console.error('Failed to set localStorage item:', err);
      return false;
    }
  }, [domain, refreshLocalStorage]);

  const setSessionStorageItem = useCallback(async (key: string, value: string): Promise<boolean> => {
    try {
      const result = await StorageService.setSessionStorageItem(key, value, domain);
      if (result.success) {
        await refreshSessionStorage();
        return true;
      } else {
        console.error('Failed to set sessionStorage item:', result.error);
        return false;
      }
    } catch (err) {
      console.error('Failed to set sessionStorage item:', err);
      return false;
    }
  }, [domain, refreshSessionStorage]);

  const setCookie = useCallback(async (
    cookie: Partial<CookieItem> & { name: string; value: string },
  ): Promise<boolean> => {
    try {
      const success = await CookieService.setCookie({ ...cookie, domain });
      if (success) {
        await refreshCookies();
      }
      return success;
    } catch (err) {
      console.error('Failed to set cookie:', err);
      return false;
    }
  }, [domain, refreshCookies]);

  const deleteLocalStorageItem = useCallback(async (key: string): Promise<boolean> => {
    try {
      const result = await StorageService.deleteLocalStorageItem(key, domain);
      if (result.success) {
        await refreshLocalStorage();
        return true;
      } else {
        console.error('Failed to delete localStorage item:', result.error);
        return false;
      }
    } catch (err) {
      console.error('Failed to delete localStorage item:', err);
      return false;
    }
  }, [domain, refreshLocalStorage]);

  const deleteSessionStorageItem = useCallback(async (key: string): Promise<boolean> => {
    try {
      const result = await StorageService.deleteSessionStorageItem(key, domain);
      if (result.success) {
        await refreshSessionStorage();
        return true;
      } else {
        console.error('Failed to delete sessionStorage item:', result.error);
        return false;
      }
    } catch (err) {
      console.error('Failed to delete sessionStorage item:', err);
      return false;
    }
  }, [domain, refreshSessionStorage]);

  const deleteCookie = useCallback(async (name: string, path?: string): Promise<boolean> => {
    try {
      const success = await CookieService.deleteCookie(domain, name, path);
      if (success) {
        await refreshCookies();
      }
      return success;
    } catch (err) {
      console.error('Failed to delete cookie:', err);
      return false;
    }
  }, [domain, refreshCookies]);

  const clearLocalStorage = useCallback(async (): Promise<boolean> => {
    try {
      const success = await StorageService.clearLocalStorage(domain);
      if (success) {
        await refreshLocalStorage();
      }
      return success;
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
      return false;
    }
  }, [domain, refreshLocalStorage]);

  const clearSessionStorage = useCallback(async (): Promise<boolean> => {
    try {
      const success = await StorageService.clearSessionStorage(domain);
      if (success) {
        await refreshSessionStorage();
      }
      return success;
    } catch (err) {
      console.error('Failed to clear sessionStorage:', err);
      return false;
    }
  }, [domain, refreshSessionStorage]);

  const clearCookies = useCallback(async (): Promise<boolean> => {
    try {
      const success = await CookieService.clearCookies(domain);
      if (success) {
        await refreshCookies();
      }
      return success;
    } catch (err) {
      console.error('Failed to clear cookies:', err);
      return false;
    }
  }, [domain, refreshCookies]);

  // 当域名变化时自动刷新数据
  useEffect(() => {
    if (domain) {
      refreshAll();
    }
  }, [domain, refreshAll]);

  return {
    localStorage,
    sessionStorage,
    cookies,
    isLoading,
    error,
    refreshLocalStorage,
    refreshSessionStorage,
    refreshCookies,
    refreshAll,
    setLocalStorageItem,
    setSessionStorageItem,
    setCookie,
    deleteLocalStorageItem,
    deleteSessionStorageItem,
    deleteCookie,
    clearLocalStorage,
    clearSessionStorage,
    clearCookies,
  };
}

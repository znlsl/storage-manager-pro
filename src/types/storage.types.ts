// 存储相关类型定义

import { BaseItem } from './common.types';

export type StorageType = 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB';

export interface StorageItem extends BaseItem {
  type: 'localStorage' | 'sessionStorage';
  domain: string;
}

export interface CookieItem {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None' | 'no_restriction' | 'lax' | 'strict';
  size: number;
}

export interface IndexedDBObjectStore {
  name: string;
  count: number;
  keyPath?: string;
  indexes: string[];
}

export interface IndexedDBInfo {
  name: string;
  version: number;
  objectStores: IndexedDBObjectStore[];
  size?: number;
}

export interface IndexedDBData {
  database: string;
  objectStore: string;
  data: Record<string, unknown>[];
}

export interface StorageStats {
  localStorage: {
    count: number;
    totalSize: number;
  };
  sessionStorage: {
    count: number;
    totalSize: number;
  };
  cookies: {
    count: number;
    totalSize: number;
  };
  indexedDB: {
    databases: number;
    totalSize?: number;
  };
}

export interface StorageFilter {
  searchTerm: string;
  storageType?: StorageType;
  domain?: string;
}

export interface StorageBackup {
  version: string;
  timestamp: number;
  domain: string;
  data: {
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
    cookies: chrome.cookies.Cookie[];
    indexedDB?: IndexedDBData[];
  };
}

// 配置文件相关类型
export interface ProfileData {
  domain: string;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>;
  timestamp: number;
}

export interface Profile {
  name: string;
  data: ProfileData;
  timestamp: number;
}

// 备份数据类型
export interface BackupData {
  id: string;
  name: string;
  description: string;
  data: Record<string, string>;
  timestamp: number;
  itemCount: number;
}

// 账户数据类型
export interface AccountData {
  id: string;
  name: string;
  description: string;
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>;
  timestamp: number;
  cookieCount: number;
  domain: string; // 顶级域名
  originalDomain: string;
}

// 工具函数相关类型
export interface FormatResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

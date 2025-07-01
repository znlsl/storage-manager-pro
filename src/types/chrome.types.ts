// Chrome API 相关类型定义

export interface ChromeTab {
  id?: number;
  url?: string;
  title?: string;
  active?: boolean;
  windowId?: number;
}

export interface ChromeMessage {
  type: string;
  payload?: unknown;
  tabId?: number;
}

export interface ChromeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ExecuteScriptOptions {
  target: {
    tabId: number;
  };
  func: (...args: unknown[]) => unknown;
  args?: unknown[];
}

export interface StorageChangeEvent {
  [key: string]: chrome.storage.StorageChange;
}

export interface CookieChangeInfo {
  removed: boolean;
  cookie: chrome.cookies.Cookie;
  cause: string;
}

// 扩展消息类型
export type MessageType =
  | 'GET_STORAGE_DATA'
  | 'SET_STORAGE_ITEM'
  | 'DELETE_STORAGE_ITEM'
  | 'CLEAR_STORAGE'
  | 'GET_COOKIES'
  | 'SET_COOKIE'
  | 'DELETE_COOKIE'
  | 'GET_TABS'
  | 'EXECUTE_SCRIPT'
  | 'OPEN_TAB'
  | 'CLOSE_TAB'
  | 'GET_TRIGGER_TAB'
  | 'COOKIE_CHANGED'
  | 'STORAGE_CHANGED';

export interface GetStorageDataMessage extends ChromeMessage {
  type: 'GET_STORAGE_DATA';
  payload: {
    domain: string;
    storageType: 'localStorage' | 'sessionStorage';
  };
}

export interface SetStorageItemMessage extends ChromeMessage {
  type: 'SET_STORAGE_ITEM';
  payload: {
    domain: string;
    storageType: 'localStorage' | 'sessionStorage';
    key: string;
    value: string;
  };
}

export interface DeleteStorageItemMessage extends ChromeMessage {
  type: 'DELETE_STORAGE_ITEM';
  payload: {
    domain: string;
    storageType: 'localStorage' | 'sessionStorage';
    key: string;
  };
}

export interface CookieChangedMessage extends ChromeMessage {
  type: 'COOKIE_CHANGED';
  payload: {
    removed: boolean;
    cookie: chrome.cookies.Cookie;
    cause: string;
    domain: string;
  };
}

export interface StorageChangedMessage extends ChromeMessage {
  type: 'STORAGE_CHANGED';
  payload: {
    key: string | null;
    oldValue: string | null;
    newValue: string | null;
    storageArea: 'localStorage' | 'sessionStorage';
    domain: string;
  };
}

// 存储数据类型
export type StorageData = Record<string, string>;

// Cookie数据类型
export interface CookieData {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

// IndexedDB相关类型
export interface IndexedDBInfo {
  name: string;
  version: number;
  objectStores: string[];
}

export interface IndexedDBData {
  databases: IndexedDBInfo[];
  data: Record<string, unknown[]>;
}

// 域名相关类型
export interface DomainInfo {
  hostname: string;
  protocol: string;
  port?: string;
  isValid: boolean;
}

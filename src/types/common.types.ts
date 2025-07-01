// 通用类型定义

export type ThemeMode = 'light' | 'dark' | 'auto';

export type Language = 'zh' | 'en';

export interface BaseItem {
  key: string;
  value: string;
  size: number;
  lastModified?: number;
}

export interface AppSettings {
  theme: ThemeMode;
  language: Language;
  windowMode: 'popup' | 'tab';
  windowSize: {
    width: number;
    height: number;
  };
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  data: {
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
    cookies: chrome.cookies.Cookie[];
  };
  createdAt: number;
  updatedAt: number;
}

export interface DomainInfo {
  domain: string;
  url: string;
  title: string;
  tabId?: number;
}

// 应用状态类型
export interface AppState {
  currentDomain: string;
  currentTab: 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB';
  selectedTabId?: number;
  isLoading: boolean;
  error?: string;
}

// 模态框类型
export interface ModalState {
  isOpen: boolean;
  type?: 'edit' | 'add' | 'delete' | 'settings' | 'profile' | 'backup' | 'account';
  data?: unknown;
}

// 通知类型
export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
}

// 搜索选项
export interface SearchOptions {
  query: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}

// 排序选项
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// 分页选项
export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
}

// 导出选项
export interface ExportOptions {
  format: 'json' | 'csv' | 'txt';
  includeMetadata?: boolean;
  compress?: boolean;
}

// 导入选项
export interface ImportOptions {
  format: 'json' | 'csv' | 'txt';
  overwrite?: boolean;
  validate?: boolean;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
}

// 事件类型
export type AppEvent =
  | 'storage-changed'
  | 'theme-changed'
  | 'language-changed'
  | 'domain-changed'
  | 'tab-changed'
  | 'profile-loaded'
  | 'backup-created'
  | 'account-switched';

// 事件监听器类型
export type EventListener<T = unknown> = (data: T) => void;

// 键值对类型
export type KeyValuePair = {
  key: string;
  value: string;
};

// 可选的键值对类型
export type OptionalKeyValuePair = {
  key?: string;
  value?: string;
};

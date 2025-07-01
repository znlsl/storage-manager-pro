// 服务相关类型定义

// 服务响应类型
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// 异步操作状态
export interface AsyncState<T = unknown> {
  loading: boolean;
  data?: T;
  error?: string;
  lastUpdated?: number;
}

// Chrome服务相关类型
export interface ChromeServiceOptions {
  timeout?: number;
  retries?: number;
  fallback?: boolean;
}

// 存储服务选项
export interface StorageServiceOptions {
  domain?: string;
  includeMetadata?: boolean;
  format?: 'raw' | 'formatted';
}

// 主题服务选项
export interface ThemeServiceOptions {
  autoDetect?: boolean;
  persistPreference?: boolean;
  applyImmediately?: boolean;
}

// 国际化服务选项
export interface I18nServiceOptions {
  fallbackLanguage?: string;
  detectBrowserLanguage?: boolean;
  persistLanguage?: boolean;
}

// 配置文件服务选项
export interface ProfileServiceOptions {
  includeTimestamp?: boolean;
  validateData?: boolean;
  autoBackup?: boolean;
}

// 工具服务选项
export interface UtilsServiceOptions {
  encoding?: 'utf8' | 'base64';
  format?: 'pretty' | 'compact';
  validate?: boolean;
}

// 服务初始化配置
export interface ServiceConfig {
  chrome?: ChromeServiceOptions;
  storage?: StorageServiceOptions;
  theme?: ThemeServiceOptions;
  i18n?: I18nServiceOptions;
  profile?: ProfileServiceOptions;
  utils?: UtilsServiceOptions;
}

// 服务状态
export interface ServiceStatus {
  initialized: boolean;
  healthy: boolean;
  lastCheck: number;
  errors: string[];
}

// 服务管理器接口
export interface ServiceManager {
  initialize(config?: ServiceConfig): Promise<void>;
  getStatus(serviceName: string): ServiceStatus;
  restart(serviceName: string): Promise<void>;
  shutdown(): Promise<void>;
}

// 缓存选项
export interface CacheOptions {
  ttl?: number; // 生存时间（毫秒）
  maxSize?: number; // 最大缓存大小
  strategy?: 'lru' | 'fifo' | 'lfu'; // 缓存策略
}

// 缓存项
export interface CacheItem<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  ttl?: number;
  hits: number;
}

// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 日志条目
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  service?: string;
  data?: unknown;
}

// 日志选项
export interface LogOptions {
  level?: LogLevel;
  maxEntries?: number;
  persist?: boolean;
  format?: 'json' | 'text';
}

// 性能指标
export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

// 监控选项
export interface MonitoringOptions {
  enabled?: boolean;
  sampleRate?: number; // 采样率 (0-1)
  maxMetrics?: number;
  reportInterval?: number;
}

// 重试选项
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  maxDelay?: number;
}

// 批处理选项
export interface BatchOptions {
  batchSize?: number;
  delay?: number;
  maxWait?: number;
  parallel?: boolean;
}

// 验证规则
export interface ValidationRule {
  field: string;
  type: 'required' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

// 验证结果
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

// 序列化选项
export interface SerializationOptions {
  format?: 'json' | 'msgpack' | 'cbor';
  compress?: boolean;
  encryption?: boolean;
}

// 反序列化选项
export interface DeserializationOptions {
  format?: 'json' | 'msgpack' | 'cbor';
  decompress?: boolean;
  decryption?: boolean;
  validate?: boolean;
}

// 事件发射器接口
export interface EventEmitter {
  on(event: string, listener: (...args: unknown[]) => void): void;
  off(event: string, listener: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  once(event: string, listener: (...args: unknown[]) => void): void;
  removeAllListeners(event?: string): void;
}

// 中间件函数类型
export type Middleware<T = unknown> = (
  context: T,
  next: () => Promise<void>
) => Promise<void>;

// 插件接口
export interface Plugin {
  name: string;
  version: string;
  initialize(context: unknown): Promise<void>;
  destroy(): Promise<void>;
}

// 钩子函数类型
export type Hook<T = unknown> = (data: T) => T | Promise<T>;

// 过滤器函数类型
export type Filter<T = unknown> = (item: T) => boolean;

// 映射器函数类型
export type Mapper<T = unknown, R = unknown> = (item: T) => R;

// 归约器函数类型
export type Reducer<T = unknown, R = unknown> = (
  accumulator: R,
  current: T,
  index: number,
  array: T[]
) => R;

// 比较器函数类型
export type Comparator<T = unknown> = (a: T, b: T) => number;

// 谓词函数类型
export type Predicate<T = unknown> = (item: T) => boolean;

// 工厂函数类型
export type Factory<T = unknown> = (...args: unknown[]) => T;

// 构建器模式接口
export interface Builder<T = unknown> {
  build(): T;
  reset(): this;
}

// 观察者模式接口
export interface Observer<T = unknown> {
  update(data: T): void;
}

export interface Observable<T = unknown> {
  subscribe(observer: Observer<T>): void;
  unsubscribe(observer: Observer<T>): void;
  notify(data: T): void;
}

// 策略模式接口
export interface Strategy<T = unknown, R = unknown> {
  execute(data: T): R;
}

// 命令模式接口
export interface Command {
  execute(): void | Promise<void>;
  undo?(): void | Promise<void>;
  redo?(): void | Promise<void>;
}

// 状态机接口
export interface StateMachine<T = string> {
  currentState: T;
  transition(event: string): boolean;
  canTransition(event: string): boolean;
  getAvailableTransitions(): string[];
}

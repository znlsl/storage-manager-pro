// 工具函数服务
export class UtilsService {
  /**
   * JSON格式化
   */
  static formatJSON(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      throw new Error('JSON格式化失败：格式不正确');
    }
  }

  /**
   * JSON压缩
   */
  static minifyJSON(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed);
    } catch (error) {
      throw new Error('JSON压缩失败：格式不正确');
    }
  }

  /**
   * Base64编码
   */
  static encodeBase64(text: string): string {
    try {
      if (!text || text.trim() === '') {
        throw new Error('内容不能为空');
      }
      return btoa(unescape(encodeURIComponent(text)));
    } catch (error) {
      throw new Error('Base64编码失败');
    }
  }

  /**
   * Base64解码
   */
  static decodeBase64(base64String: string): string {
    try {
      if (!base64String || base64String.trim() === '') {
        throw new Error('内容不能为空');
      }
      return decodeURIComponent(escape(atob(base64String)));
    } catch (error) {
      throw new Error('Base64解码失败：无效的Base64格式');
    }
  }

  /**
   * UTF-8编码 - 返回URL编码格式
   */
  static encodeUTF8(text: string): string {
    try {
      if (!text || text.trim() === '') {
        throw new Error('内容不能为空');
      }
      // 使用encodeURIComponent进行UTF-8编码
      return encodeURIComponent(text);
    } catch (error) {
      throw new Error('UTF-8编码失败');
    }
  }

  /**
   * UTF-8编码 - 返回十六进制格式
   */
  static encodeUTF8Hex(text: string): string {
    try {
      if (!text || text.trim() === '') {
        throw new Error('内容不能为空');
      }
      // 将字符串转换为UTF-8字节数组，然后转换为十六进制
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);
      return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ');
    } catch (error) {
      throw new Error('UTF-8十六进制编码失败');
    }
  }

  /**
   * UTF-8解码 - 从URL编码格式解码
   */
  static decodeUTF8(encodedText: string): string {
    try {
      if (!encodedText || encodedText.trim() === '') {
        throw new Error('内容不能为空');
      }
      return decodeURIComponent(encodedText);
    } catch (error) {
      throw new Error('UTF-8解码失败：无效的UTF-8格式');
    }
  }

  /**
   * UTF-8解码 - 从十六进制格式解码
   */
  static decodeUTF8Hex(hexText: string): string {
    try {
      if (!hexText || hexText.trim() === '') {
        throw new Error('内容不能为空');
      }
      // 移除空格并解析十六进制字节
      const hexBytes = hexText.replace(/\s+/g, '').match(/.{1,2}/g);
      if (!hexBytes) {
        throw new Error('无效的十六进制格式');
      }

      const bytes = new Uint8Array(hexBytes.map(hex => parseInt(hex, 16)));
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes);
    } catch (error) {
      throw new Error('UTF-8十六进制解码失败');
    }
  }

  /**
   * Unicode编码 - 返回Unicode转义格式 (\uXXXX)
   */
  static encodeUnicode(text: string): string {
    try {
      if (!text || text.trim() === '') {
        throw new Error('内容不能为空');
      }
      return Array.from(text)
        .map(char => '\\u' + char.codePointAt(0)!.toString(16).toLowerCase().padStart(4, '0'))
        .join('');
    } catch (error) {
      throw new Error('Unicode编码失败');
    }
  }

  /**
   * Unicode解码 - 从Unicode转义格式解码 (\uXXXX)
   */
  static decodeUnicode(unicodeText: string): string {
    try {
      if (!unicodeText || unicodeText.trim() === '') {
        throw new Error('内容不能为空');
      }
      // 匹配 \uXXXX 格式
      const unicodeMatches = unicodeText.match(/\\u([0-9A-Fa-f]{4})/g);
      if (!unicodeMatches) {
        throw new Error('无效的Unicode格式');
      }

      return unicodeMatches
        .map(match => {
          const codePoint = parseInt(match.substring(2), 16);
          return String.fromCodePoint(codePoint);
        })
        .join('');
    } catch (error) {
      throw new Error('Unicode解码失败');
    }
  }

  /**
   * HTML实体编码 - 返回HTML实体格式 (&#xXXXX;)
   */
  static encodeHtmlEntity(text: string): string {
    try {
      if (!text || text.trim() === '') {
        throw new Error('内容不能为空');
      }
      return Array.from(text)
        .map(char => '&#x' + char.codePointAt(0)!.toString(16).toUpperCase() + ';')
        .join('');
    } catch (error) {
      throw new Error('HTML实体编码失败');
    }
  }

  /**
   * HTML实体解码 - 从HTML实体格式解码 (&#xXXXX; 或 &#DDDD;)
   */
  static decodeHtmlEntity(entityText: string): string {
    try {
      if (!entityText || entityText.trim() === '') {
        throw new Error('内容不能为空');
      }

      // 匹配十六进制实体 &#xXXXX; 和十进制实体 &#DDDD;
      return entityText.replace(/&#x([0-9A-Fa-f]+);|&#(\d+);/g, (_match, hex, dec) => {
        const codePoint = hex ? parseInt(hex, 16) : parseInt(dec, 10);
        return String.fromCodePoint(codePoint);
      });
    } catch (error) {
      throw new Error('HTML实体解码失败');
    }
  }

  /**
   * 检查URL是否为有效的域名URL
   */
  static isValidDomainUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // 排除的URL前缀
    const excludedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'edge://',
      'about:',
      'data:',
      'blob:',
      'file://',
      'ftp://',
    ];

    return !excludedPrefixes.some(prefix => url.startsWith(prefix));
  }

  /**
   * 提取顶级域名
   */
  static extractTopLevelDomain(domain: string): string {
    if (!domain) {
      return '';
    }

    // 处理特殊情况: localhost, IP地址
    if (domain === 'localhost' || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
      return domain;
    }

    const parts = domain.split('.');

    // 处理 .co.uk, .com.cn 等情况
    if (parts.length >= 3) {
      const secondLevelTld = ['co.uk', 'com.cn', 'com.au', 'com.tw', 'co.jp'];
      const lastTwoParts = parts.slice(-2).join('.');

      if (secondLevelTld.includes(lastTwoParts)) {
        // 例如 example.co.uk，返回 example.co.uk
        return parts.slice(-3).join('.');
      }
    }

    // 一般情况下返回最后两部分，例如 example.com
    return parts.slice(-2).join('.');
  }

  /**
   * 从URL中提取域名
   */
  static extractDomainFromUrl(url: string): string {
    try {
      if (!this.isValidDomainUrl(url)) {
        return '';
      }
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return '';
    }
  }

  /**
   * 构建有效的Cookie API URL
   * 将域名或IP地址转换为Chrome Cookie API可接受的完整URL格式
   */
  static buildCookieUrl(domain: string): string {
    if (!domain || typeof domain !== 'string') {
      return '';
    }

    // 清理域名格式，移除协议和路径
    const cleanDomain = domain.trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, ''); // 移除端口号

    if (!cleanDomain) {
      return '';
    }

    // 如果域名以点开头（如 .example.com），移除开头的点来构建URL
    // 因为URL不能以点开头，但Cookie域名可以
    let urlDomain = cleanDomain;
    if (cleanDomain.startsWith('.')) {
      urlDomain = cleanDomain.substring(1);
    }

    if (!urlDomain) {
      return '';
    }

    // 检查是否为IP地址
    const isIpAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlDomain);

    if (isIpAddress) {
      // 对于IP地址，使用http协议（因为大多数本地IP不支持https）
      return `http://${urlDomain}`;
    } else {
      // 对于域名，优先使用https协议
      return `https://${urlDomain}`;
    }
  }

  /**
   * 验证域名或IP地址格式
   */
  static isValidDomainOrIp(domain: string): boolean {
    if (!domain || typeof domain !== 'string') {
      return false;
    }

    const cleanDomain = domain.trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');

    // 检查IP地址格式
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(cleanDomain)) {
      // 验证IP地址范围
      const parts = cleanDomain.split('.').map(Number);
      return parts.every(part => part >= 0 && part <= 255);
    }

    // 检查Cookie域名格式（支持以点开头的域名，如 .example.com）
    if (cleanDomain.startsWith('.')) {
      // 移除开头的点进行验证
      const domainWithoutDot = cleanDomain.substring(1);
      if (!domainWithoutDot) {
        return false;
      }
      // 验证去掉点后的域名格式
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return domainRegex.test(domainWithoutDot);
    }

    // 检查普通域名格式
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(cleanDomain);
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 格式化时间戳
   */
  static formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * 格式化相对时间
   */
  static formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < week) {
      return `${Math.floor(diff / day)}天前`;
    } else if (diff < month) {
      return `${Math.floor(diff / week)}周前`;
    } else if (diff < year) {
      return `${Math.floor(diff / month)}个月前`;
    } else {
      return `${Math.floor(diff / year)}年前`;
    }
  }

  /**
   * 深拷贝对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      Object.keys(obj).forEach(key => {
        (cloned as any)[key] = this.deepClone((obj as any)[key]);
      });
      return cloned;
    }

    return obj;
  }

  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    let timeout: number;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 生成随机ID
   */
  static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * 生成UUID
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 验证JSON格式（仅对象和数组）
   */
  static isValidJSON(str: string): boolean {
    if (!str || str.trim() === '') {
      return false;
    }

    try {
      const parsed = JSON.parse(str);
      // 只有当解析结果是对象或数组时，才认为是需要格式化的JSON
      // 排除简单的字符串、数字、布尔值、null等
      return typeof parsed === 'object' && parsed !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证Base64格式
   */
  static isValidBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (error) {
      return false;
    }
  }

  /**
   * 转义HTML
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 反转义HTML
   */
  static unescapeHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * 计算字符串字节大小
   */
  static getStringByteSize(str: string): number {
    return new Blob([str]).size;
  }

  /**
   * 提取顶级域名用于 Cookie
   * 对于域名（如 www.yy.com）返回 .yy.com
   * 对于 IP 地址保持原样
   */
  static extractCookieDomain(domain: string): string {
    if (!domain) {
      return domain;
    }

    // 检查是否为 IP 地址
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(domain)) {
      return domain; // IP 地址保持原样
    }

    // 对于域名，提取顶级域名
    const parts = domain.split('.');
    if (parts.length >= 2) {
      // 返回最后两个部分，前面加点
      return '.' + parts.slice(-2).join('.');
    }

    // 如果只有一个部分，直接返回
    return domain;
  }

  /**
   * 截断文本
   */
  static truncateText(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 格式化日期
   */
  static formatDate(date: Date): string {
    return date.toLocaleString();
  }
}

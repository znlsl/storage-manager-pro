// Cookie 管理服务
import type { CookieItem } from '../types/storage.types';
import { UtilsService } from './utils.service';

export class CookieService {
  /**
   * 获取指定域名的所有 Cookies
   */
  static async getCookies(domain: string): Promise<CookieItem[]> {
    try {
      // 验证域名格式
      if (!UtilsService.isValidDomainOrIp(domain)) {
        console.error(`Invalid domain or IP address: "${domain}"`);
        return [];
      }

      // 构建有效的URL用于Cookie API
      const url = UtilsService.buildCookieUrl(domain);
      if (!url) {
        console.error(`Cannot build valid URL from domain: "${domain}"`);
        return [];
      }

      // 使用URL而不是domain参数来获取cookies
      const cookies = await chrome.cookies.getAll({ url });

      return cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expirationDate,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: this.normalizeSameSite(cookie.sameSite),
        size: new Blob([cookie.name + cookie.value]).size,
      }));
    } catch (error) {
      console.error('Failed to get cookies:', error);
      return [];
    }
  }

  /**
   * 设置 Cookie
   */
  static async setCookie(cookie: Partial<CookieItem> & {
    name: string;
    value: string;
    domain: string;
  }): Promise<boolean> {
    try {
      // 验证域名格式
      if (!UtilsService.isValidDomainOrIp(cookie.domain)) {
        console.error(`Invalid domain or IP address: "${cookie.domain}"`);
        return false;
      }

      // 构建有效的URL
      const url = UtilsService.buildCookieUrl(cookie.domain);
      if (!url) {
        console.error(`Cannot build valid URL from domain: "${cookie.domain}"`);
        return false;
      }

      // 标准化 SameSite 值
      const normalizedSameSite = this.chromeNormalizeSameSite(cookie.sameSite);

      const cookieDetails: chrome.cookies.SetDetails = {
        url,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || '/',
        secure: cookie.secure || false,
        httpOnly: cookie.httpOnly || false,
        sameSite: normalizedSameSite,
      };

      if (cookie.expires) {
        cookieDetails.expirationDate = cookie.expires;
      }

      // 添加详细的调试信息
      console.log(`[Cookie Service] Setting cookie "${cookie.name}" for domain "${cookie.domain}":`, {
        url,
        name: cookie.name,
        domain: cookie.domain,
        path: cookie.path || '/',
        originalSameSite: cookie.sameSite,
        normalizedSameSite,
        secure: cookie.secure || false,
        httpOnly: cookie.httpOnly || false,
        expires: cookie.expires,
        cookieDetails,
      });

      const result = await chrome.cookies.set(cookieDetails);

      if (result) {
        console.log(`[Cookie Service] Successfully set cookie "${cookie.name}" for domain "${cookie.domain}"`);
      } else {
        console.error(`[Cookie Service] Failed to set cookie "${cookie.name}" for domain "${cookie.domain}"`);
      }

      return !!result;
    } catch (error) {
      console.error('Failed to set cookie:', error);
      return false;
    }
  }

  /**
   * 删除 Cookie
   */
  static async deleteCookie(domain: string, name: string, path?: string): Promise<boolean> {
    try {
      // 验证域名格式
      if (!UtilsService.isValidDomainOrIp(domain)) {
        console.error(`Invalid domain or IP address: "${domain}"`);
        return false;
      }

      // 构建有效的URL
      const baseUrl = UtilsService.buildCookieUrl(domain);
      if (!baseUrl) {
        console.error(`Cannot build valid URL from domain: "${domain}"`);
        return false;
      }

      // 添加路径到URL
      const url = path && path !== '/' ? `${baseUrl}${path}` : baseUrl;

      const result = await chrome.cookies.remove({ url, name });
      return !!result;
    } catch (error) {
      console.error('Failed to delete cookie:', error);
      return false;
    }
  }

  /**
   * 清空指定域名的所有 Cookies
   */
  static async clearCookies(domain: string): Promise<boolean> {
    try {
      const cookies = await this.getCookies(domain);
      const deletePromises = cookies.map(cookie =>
        this.deleteCookie(cookie.domain, cookie.name, cookie.path),
      );

      const results = await Promise.all(deletePromises);
      return results.every(result => result);
    } catch (error) {
      console.error('Failed to clear cookies:', error);
      return false;
    }
  }

  /**
   * 获取所有域名的 Cookies 统计
   */
  static async getAllCookiesStats(): Promise<Record<string, number>> {
    try {
      const allCookies = await chrome.cookies.getAll({});
      const stats: Record<string, number> = {};

      allCookies.forEach(cookie => {
        const domain = cookie.domain.startsWith('.')
          ? cookie.domain.substring(1)
          : cookie.domain;
        stats[domain] = (stats[domain] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get cookies stats:', error);
      return {};
    }
  }

  /**
   * 导出 Cookies 为 JSON
   */
  static async exportCookies(domain: string): Promise<string> {
    try {
      const cookies = await this.getCookies(domain);
      return JSON.stringify(cookies, null, 2);
    } catch (error) {
      console.error('Failed to export cookies:', error);
      return '[]';
    }
  }

  /**
   * 从 JSON 导入 Cookies
   */
  static async importCookies(domain: string, jsonData: string): Promise<boolean> {
    try {
      const cookies: CookieItem[] = JSON.parse(jsonData);

      if (!Array.isArray(cookies)) {
        throw new Error('Invalid cookies data format');
      }

      const importPromises = cookies.map(cookie =>
        this.setCookie({
          ...cookie,
          domain: domain, // 强制使用指定域名
        }),
      );

      const results = await Promise.all(importPromises);
      return results.every(result => result);
    } catch (error) {
      console.error('Failed to import cookies:', error);
      return false;
    }
  }

  /**
   * 备份 Cookies
   */
  static async backupCookies(domain: string): Promise<CookieItem[]> {
    try {
      return await this.getCookies(domain);
    } catch (error) {
      console.error('Failed to backup cookies:', error);
      return [];
    }
  }

  /**
   * 恢复 Cookies
   */
  static async restoreCookies(domain: string, cookies: CookieItem[]): Promise<boolean> {
    try {
      // 先清空现有 Cookies
      await this.clearCookies(domain);

      // 然后设置新的 Cookies
      const restorePromises = cookies.map(cookie =>
        this.setCookie({
          ...cookie,
          domain: domain,
        }),
      );

      const results = await Promise.all(restorePromises);
      return results.every(result => result);
    } catch (error) {
      console.error('Failed to restore cookies:', error);
      return false;
    }
  }

  /**
   * 标准化 SameSite 属性
   */
  private static normalizeSameSite(
    sameSite?: chrome.cookies.SameSiteStatus,
  ): CookieItem['sameSite'] {
    switch (sameSite) {
      case 'strict':
        return 'Strict';
      case 'lax':
        return 'Lax';
      case 'no_restriction':
        return 'None';
      default:
        return 'Lax';
    }
  }

  /**
   * 转换为 Chrome API 的 SameSite 格式
   */
  private static chromeNormalizeSameSite(
    sameSite?: CookieItem['sameSite'] | string | null,
  ): chrome.cookies.SameSiteStatus {
    // 处理 null、undefined 或空值
    if (!sameSite || sameSite === 'undefined' || sameSite === 'null') {
      return 'unspecified';
    }

    // 转换为字符串并标准化
    const normalizedValue = sameSite.toString().toLowerCase().trim();

    // 处理各种可能的 SameSite 值
    switch (normalizedValue) {
      case 'strict':
      case 'samesite=strict':
        return 'strict';
      case 'lax':
      case 'samesite=lax':
        return 'lax';
      case 'none':
      case 'no_restriction':
      case 'samesite=none':
        return 'no_restriction';
      case 'unspecified':
      case '':
        return 'unspecified';
      default:
        console.warn(`Unknown SameSite value: "${sameSite}", using 'unspecified' as default`);
        return 'unspecified';
    }
  }

  /**
   * 验证 Cookie 名称
   */
  static isValidCookieName(name: string): boolean {
    // Cookie 名称不能包含特殊字符
    const invalidChars = /[()<>@,;:\\"\/[\]?={}\s]/;
    return name.length > 0 && !invalidChars.test(name);
  }

  /**
   * 验证 Cookie 值
   */
  static isValidCookieValue(value: string): boolean {
    // Cookie 值不能包含某些特殊字符
    const invalidChars = /[,;\\"]/;
    return !invalidChars.test(value);
  }

  /**
   * 验证域名格式
   */
  static isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  }
}

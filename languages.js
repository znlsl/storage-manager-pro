// 语言配置
const languages = {
  "zh": {
    "title": "Storage Manager Pro",
    "domain_label": "当前域名:",
    "tab_localStorage": "本地存储空间",
    "tab_sessionStorage": "会话存储空间",
    "tab_cookies": "Cookies",
    "tab_indexedDB": "IndexedDB",
    "add_item": "添加项目",
    "add_cookie": "添加Cookie",
    "clear_all": "清空全部",
    "backup": "备份",
    "restore": "恢复",
    "refresh": "刷新",
    "search_placeholder": "搜索...",
    "save_account": "保存账户",
    "switch_account": "切换账户",
    "edit_item": "编辑项目",
    "cancel": "取消",
    "save": "保存",
    "confirm": "确认",
    "edit": "编辑",
    "delete": "删除",
    "confirm_delete": "确定要删除",
    "show_more": "显示更多",
    "show_less": "显示更少",
    "key_label": "键名",
    "value_label": "值",
    "domain_field": "域名",
    "path_field": "路径",
    "expires_field": "过期时间",
    "samesite_field": "SameSite",
    "samesite_none": "无",
    "samesite_lax": "Lax",
    "samesite_strict": "Strict",
    "samesite_none_value": "None",
    "select_profile": "选择配置文件...",
    "save_profile": "保存当前配置",
    "manage_profiles": "管理配置文件",
    "current_profile": "当前配置:",
    "profile_management": "配置文件管理",
    "profile_name": "配置文件名称",
    "profile_name_placeholder": "输入配置文件名称",
    "include_content": "包含内容",
    "existing_profiles": "现有配置文件",
    "close": "关闭",
    "save_config": "保存配置",
    "load": "加载",
    "created_time": "创建时间:",
    "no_profiles": "暂无配置文件",
    "backup_title": "LocalStorage 备份",
    "backup_name": "备份名称",
    "backup_name_placeholder": "输入备份名称",
    "backup_description": "备份描述",
    "backup_description_placeholder": "可选的备份描述",
    "select_backup": "选择要恢复的备份",
    "format_json": "格式化JSON",
    "minify_json": "压缩JSON",
    "encode_base64": "Base64编码",
    "decode_base64": "Base64解码",
    "encode_utf8": "UTF-8编码",
    "decode_utf8": "UTF-8解码",
    "pin_popup": "固定弹窗",
    "unpin_popup": "取消固定",
    "base64_encode_success": "Base64编码成功",
    "base64_decode_success": "Base64解码成功",
    "utf8_encode_success": "UTF-8编码成功",
    "utf8_decode_success": "UTF-8解码成功",
    "invalid_base64": "无效的Base64格式",
    "invalid_utf8": "无效的UTF-8格式",
    "encoding_error": "编码错误",
    "decoding_error": "解码错误",
    "empty_content": "内容不能为空",
    "invalid_json": "不是有效的JSON格式",
    "please_enter_profile_name": "请输入配置文件名称",
    "account_management": "Cookie 账户管理",
    "account_name": "账户名称",
    "account_name_placeholder": "输入账户名称（如：主账号、测试账号）",
    "account_description": "账户描述",
    "account_description_placeholder": "可选的账户描述",
    "select_account": "选择要切换的账户",
    "please_select_content": "请至少选择一种内容",
    "profile_saved": "配置已保存",
    "profile_save_failed": "配置保存失败",
    "default_profile": "默认配置",
    "no_backups": "暂无备份",
    "items": "项目",
    "please_select_backup": "请选择要恢复的备份",
    "backup_not_found": "找不到备份数据",
    "cannot_access_tab": "无法访问当前标签页或该标签页是Chrome内部页面",
    "backup_restored": "备份已恢复",
    "restore_failed": "恢复备份失败",
    "please_enter_backup_name": "请输入备份名称",
    "backup_created": "备份创建成功！",
    "backup_create_failed": "创建备份失败",
    "no_indexeddb": "暂无IndexedDB数据库",
    "indexeddb_error": "错误",
    "store_count": "项目数",
    "store_keypath": "主键",
    "indices": "索引",
    "sample_data": "样本数据 (前10条)",
    "no_object_stores": "无对象仓库",
    "confirm_title": "确认删除",
    "confirm_delete_item": "确定要删除 \"{name}\" 吗？",
    "confirm_clear_localStorage": "确定要清空所有LocalStorage数据吗？",
    "confirm_clear_sessionStorage": "确定要清空所有SessionStorage数据吗？",
    "confirm_clear_cookies": "确定要清空所有Cookies吗？",
    "confirm_restore_backup": "确定要恢复此备份吗？当前数据将被覆盖",
    "confirm_save_profile": "配置文件 \"{name}\" 已存在，是否覆盖？",
    "yes": "是",
    "no": "否",
    "ok": "确定",
    "success": "操作成功",
    "cookies_cleared": "所有Cookie已清除",
    "no_cookies": "暂无Cookies",
    "no_data": "暂无数据",
    "no_matching_cookies": "找到 Cookies，但没有匹配当前搜索条件",
    "alert_title": "提示",
    "save_cookie_account": "保存Cookie账户",
    "switch_cookie_account": "切换Cookie账户",
    "no_accounts": "暂无账户",
    "saved_time": "保存时间",
    "cookie_count": "Cookie数",
    "confirm_delete_account": "确定要删除这个账户吗？",
    "confirm_switch_account": "切换账户将替换当前的所有Cookies，确定要继续吗？",
    "account_saved": "账户 \"{name}\" 已保存！",
    "please_enter_account_name": "请输入账户名称",
    "please_select_account": "请选择要切换的账户",
    "account_switched": "账户已切换",
    "switch_success": "切换成功",
    "save_success": "保存成功",
    "error": "错误",
    "overwrite_confirm": "确认覆盖",
    "restore_success": "恢复成功"
  },
  "en": {
    "title": "Storage Manager Pro",
    "domain_label": "Current Domain:",
    "tab_localStorage": "Local Storage",
    "tab_sessionStorage": "Session Storage",
    "tab_cookies": "Cookies",
    "tab_indexedDB": "IndexedDB",
    "add_item": "Add Item",
    "add_cookie": "Add Cookie",
    "clear_all": "Clear All",
    "backup": "Backup",
    "restore": "Restore",
    "refresh": "Refresh",
    "search_placeholder": "Search...",
    "save_account": "Save Account",
    "switch_account": "Switch Account",
    "edit_item": "Edit Item",
    "cancel": "Cancel",
    "save": "Save",
    "confirm": "Confirm",
    "edit": "Edit",
    "delete": "Delete",
    "confirm_delete": "Confirm Delete",
    "show_more": "Show More",
    "show_less": "Show Less",
    "key_label": "Key",
    "value_label": "Value",
    "domain_field": "Domain",
    "path_field": "Path",
    "expires_field": "Expires",
    "samesite_field": "SameSite",
    "samesite_none": "None",
    "samesite_lax": "Lax",
    "samesite_strict": "Strict",
    "samesite_none_value": "None",
    "select_profile": "Select Profile...",
    "save_profile": "Save Current Profile",
    "manage_profiles": "Manage Profiles",
    "current_profile": "Current Profile:",
    "profile_management": "Profile Management",
    "profile_name": "Profile Name",
    "profile_name_placeholder": "Enter profile name",
    "include_content": "Include Content",
    "existing_profiles": "Existing Profiles",
    "close": "Close",
    "save_config": "Save Config",
    "load": "Load",
    "created_time": "Created:",
    "no_profiles": "No profiles yet",
    "backup_title": "LocalStorage Backup",
    "backup_name": "Backup Name",
    "backup_name_placeholder": "Enter backup name",
    "backup_description": "Backup Description",
    "backup_description_placeholder": "Optional backup description",
    "select_backup": "Select backup to restore",
    "format_json": "Format JSON",
    "minify_json": "Minify JSON",
    "encode_base64": "Base64 Encode",
    "decode_base64": "Base64 Decode",
    "encode_utf8": "UTF-8 Encode",
    "decode_utf8": "UTF-8 Decode",
    "pin_popup": "Pin Popup",
    "unpin_popup": "Unpin Popup",
    "base64_encode_success": "Base64 encoded successfully",
    "base64_decode_success": "Base64 decoded successfully",
    "utf8_encode_success": "UTF-8 encoded successfully",
    "utf8_decode_success": "UTF-8 decoded successfully",
    "invalid_base64": "Invalid Base64 format",
    "invalid_utf8": "Invalid UTF-8 format",
    "encoding_error": "Encoding error",
    "decoding_error": "Decoding error",
    "empty_content": "Content cannot be empty",
    "invalid_json": "Invalid JSON format",
    "please_enter_profile_name": "Please enter a profile name",
    "account_management": "Cookie Account Management",
    "account_name": "Account Name",
    "account_name_placeholder": "Enter account name (e.g. Main, Test)",
    "account_description": "Account Description",
    "account_description_placeholder": "Optional account description",
    "select_account": "Select account to switch",
    "please_select_content": "Please select at least one content type",
    "profile_saved": "Profile saved successfully",
    "profile_save_failed": "Failed to save profile",
    "default_profile": "Default Profile",
    "no_backups": "No backups yet",
    "items": "items",
    "please_select_backup": "Please select a backup to restore",
    "backup_not_found": "Backup data not found",
    "cannot_access_tab": "Cannot access current tab or tab is a Chrome internal page",
    "backup_restored": "Backup restored successfully",
    "restore_failed": "Failed to restore backup",
    "please_enter_backup_name": "Please enter a backup name",
    "backup_created": "Backup created successfully",
    "backup_create_failed": "Failed to create backup",
    "no_indexeddb": "No IndexedDB databases",
    "indexeddb_error": "Error",
    "store_count": "Items count",
    "store_keypath": "Key path",
    "indices": "Indices",
    "sample_data": "Sample data (first 10)",
    "no_object_stores": "No object stores",
    "confirm_title": "Confirm Delete",
    "confirm_delete_item": "Are you sure you want to delete \"{name}\"?",
    "confirm_clear_localStorage": "Are you sure you want to clear all LocalStorage data?",
    "confirm_clear_sessionStorage": "Are you sure you want to clear all SessionStorage data?",
    "confirm_clear_cookies": "Are you sure you want to clear all Cookies?",
    "confirm_restore_backup": "Are you sure you want to restore this backup? Current data will be overwritten",
    "confirm_save_profile": "Profile \"{name}\" already exists. Do you want to overwrite it?",
    "yes": "Yes",
    "no": "No",
    "ok": "OK",
    "success": "Success",
    "cookies_cleared": "All Cookies have been cleared",
    "no_cookies": "No Cookies",
    "no_data": "No Data",
    "no_matching_cookies": "Cookies found, but none match your search criteria",
    "alert_title": "Notice",
    "save_cookie_account": "Save Cookie Account",
    "switch_cookie_account": "Switch Cookie Account",
    "no_accounts": "No accounts yet",
    "saved_time": "Saved time",
    "cookie_count": "Cookies count",
    "confirm_delete_account": "Are you sure you want to delete this account?",
    "confirm_switch_account": "Switching accounts will replace all current cookies. Do you want to continue?",
    "account_saved": "Account \"{name}\" has been saved!",
    "please_enter_account_name": "Please enter an account name",
    "please_select_account": "Please select an account to switch to",
    "account_switched": "Account switched successfully",
    "switch_success": "Switch Success",
    "save_success": "Save Success",
    "error": "Error",
    "overwrite_confirm": "Confirm Overwrite",
    "restore_success": "Restore Success"
  }
};

// 语言管理
class LanguageManager {
  constructor() {
    this.currentLang = '';
    this.initializeLanguage();
  }

  // 初始化语言
  async initializeLanguage() {
    try {
      console.log('LanguageManager.initializeLanguage: 从storage获取语言设置');
      // 先从存储中获取已保存的语言设置
      const result = await chrome.storage.local.get(['language']);
      
      console.log('LanguageManager.initializeLanguage: 获取结果', result);
      
      if (result.language) {
        // 如果已有语言设置，使用该设置
        this.currentLang = result.language;
        console.log('LanguageManager.initializeLanguage: 使用已保存的语言设置', this.currentLang);
      } else {
        // 否则根据浏览器语言设置决定默认语言
        const browserLang = navigator.language.substring(0, 2);
        this.currentLang = browserLang === 'zh' ? 'zh' : 'en';
        console.log('LanguageManager.initializeLanguage: 使用浏览器默认语言设置', this.currentLang);
        
        // 保存默认语言设置
        await this.saveLanguage(this.currentLang);
      }
      
      // 再次验证语言设置是否保存成功
      const verifyResult = await chrome.storage.local.get(['language']);
      console.log('LanguageManager.initializeLanguage: 验证语言设置', verifyResult);
      
      return this.currentLang;
    } catch (error) {
      console.error('LanguageManager.initializeLanguage: 初始化语言出错', error);
      // 默认使用英文
      this.currentLang = 'en';
      return this.currentLang;
    }
  }

  // 获取当前语言
  getCurrentLanguage() {
    return this.currentLang;
  }

  // 设置语言
  async setLanguage(lang) {
    if (lang !== 'zh' && lang !== 'en') {
      console.error(`LanguageManager.setLanguage: 不支持的语言 ${lang}`);
      return false;
    }
    
    try {
      console.log(`LanguageManager.setLanguage: 设置语言为 ${lang}`);
      this.currentLang = lang;
      await this.saveLanguage(lang);
      return true;
    } catch (error) {
      console.error(`LanguageManager.setLanguage: 设置语言失败:`, error);
      return false;
    }
  }

  // 保存语言设置
  async saveLanguage(lang) {
    try {
      console.log(`LanguageManager.saveLanguage: 保存语言设置 ${lang} 到 chrome.storage.local`);
      await chrome.storage.local.set({ language: lang });
      
      // 验证保存是否成功
      const result = await chrome.storage.local.get(['language']);
      console.log(`LanguageManager.saveLanguage: 验证保存结果:`, result);
      
      if (!result.language || result.language !== lang) {
        console.error(`LanguageManager.saveLanguage: 保存验证失败，期望 ${lang}，实际 ${result.language || '未定义'}`);
      }
    } catch (error) {
      console.error('LanguageManager.saveLanguage: 保存语言设置到storage失败:', error);
      throw error;
    }
  }

  // 获取翻译文本
  getText(key) {
    if (languages[this.currentLang] && languages[this.currentLang][key]) {
      return languages[this.currentLang][key];
    }
    
    // 如果找不到对应的翻译，返回英文版本，如果英文也没有则返回键名
    if (languages['en'] && languages['en'][key]) {
      return languages['en'][key];
    }
    
    return key;
  }

  // 翻译整个页面
  translatePage() {
    // 翻译所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.getText(key);
    });

    // 翻译所有带有 data-i18n-placeholder 属性的 input 元素的 placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.getText(key);
    });

    // 翻译所有带有 data-i18n-title 属性的元素的 title
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.getText(key);
    });
  }
}

// 导出语言管理器实例
const languageManager = new LanguageManager(); 

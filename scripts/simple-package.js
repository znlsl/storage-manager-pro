#!/usr/bin/env node

/**
 * Storage Manager Pro - 简化打包脚本
 * 验证构建文件并创建发布准备
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimplePackager {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distPath = path.join(this.projectRoot, 'dist');
    this.packagePath = path.join(this.projectRoot, 'packages');
    this.version = this.getVersion();
  }

  /**
   * 获取版本号
   */
  getVersion() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      console.warn('无法读取版本号，使用默认版本');
      return '2.0.0';
    }
  }

  /**
   * 验证构建文件
   */
  validateBuild() {
    console.log('🔍 验证构建文件...');
    
    const requiredFiles = [
      'manifest.json',
      'tab.html',
      'tab.js',
      'background.js',
      'content.js',
      'init.js',
      'icons/icon16.png',
      'icons/icon48.png',
      'icons/icon128.png',
    ];

    const missingFiles = [];
    const existingFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.distPath, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      } else {
        const stats = fs.statSync(filePath);
        existingFiles.push({
          name: file,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2)
        });
      }
    }

    if (missingFiles.length > 0) {
      throw new Error(`缺少必要文件: ${missingFiles.join(', ')}`);
    }

    console.log('✅ 所有必要文件都存在');
    return existingFiles;
  }

  /**
   * 验证manifest.json
   */
  validateManifest() {
    console.log('🔍 验证manifest.json...');
    
    const manifestPath = path.join(this.distPath, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // 检查必要字段
    const requiredFields = ['name', 'version', 'manifest_version', 'permissions'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`manifest.json缺少必要字段: ${missingFields.join(', ')}`);
    }

    // 检查版本号
    if (manifest.version !== this.version) {
      console.warn(`⚠️ manifest.json版本号(${manifest.version})与package.json(${this.version})不一致`);
    }

    // 检查权限
    const requiredPermissions = ['storage', 'cookies', 'activeTab', 'scripting', 'tabs'];
    const missingPermissions = requiredPermissions.filter(
      perm => !manifest.permissions.includes(perm)
    );
    
    if (missingPermissions.length > 0) {
      console.warn(`⚠️ 可能缺少权限: ${missingPermissions.join(', ')}`);
    }

    console.log('✅ manifest.json验证通过');
    return manifest;
  }

  /**
   * 创建包目录
   */
  createPackageDirectory() {
    if (!fs.existsSync(this.packagePath)) {
      fs.mkdirSync(this.packagePath, { recursive: true });
      console.log('📁 创建packages目录');
    }
  }

  /**
   * 生成发布说明
   */
  generateReleaseNotes(files) {
    console.log('📝 生成发布说明...');
    
    const releaseNotes = {
      version: this.version,
      buildDate: new Date().toISOString(),
      files: files,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      instructions: {
        installation: [
          '1. 打开Chrome浏览器',
          '2. 访问 chrome://extensions/',
          '3. 开启"开发者模式"',
          '4. 点击"加载已解压的扩展程序"',
          '5. 选择dist文件夹',
          '6. 扩展安装完成'
        ],
        usage: [
          '1. 点击扩展图标打开Storage Manager Pro',
          '2. 选择要管理的域名',
          '3. 查看和编辑localStorage、sessionStorage、cookies等',
          '4. 使用格式化工具美化JSON数据',
          '5. 保存和加载配置文件'
        ]
      }
    };

    // 保存发布说明
    const releaseNotesPath = path.join(this.packagePath, `release-notes-v${this.version}.json`);
    fs.writeFileSync(releaseNotesPath, JSON.stringify(releaseNotes, null, 2));
    
    console.log(`✅ 发布说明已保存: release-notes-v${this.version}.json`);
    return releaseNotes;
  }

  /**
   * 创建安装指南
   */
  createInstallationGuide() {
    console.log('📖 创建安装指南...');
    
    const guide = `# Storage Manager Pro v${this.version} 安装指南

## 安装步骤

### 方法一：开发者模式安装（推荐）
1. 打开Chrome浏览器
2. 在地址栏输入 \`chrome://extensions/\` 并回车
3. 在右上角开启"开发者模式"
4. 点击"加载已解压的扩展程序"按钮
5. 选择项目的 \`dist\` 文件夹
6. 扩展安装完成

### 方法二：拖拽安装
1. 打开Chrome浏览器
2. 访问 \`chrome://extensions/\`
3. 开启"开发者模式"
4. 将整个 \`dist\` 文件夹拖拽到扩展页面
5. 确认安装

## 使用说明

1. **打开扩展**：点击浏览器工具栏中的Storage Manager Pro图标
2. **选择域名**：从下拉列表中选择要管理的网站域名
3. **管理存储**：
   - 查看和编辑localStorage数据
   - 管理sessionStorage内容
   - 编辑网站cookies
   - 查看IndexedDB信息
4. **格式化工具**：使用JSON格式化和压缩功能
5. **配置管理**：保存和加载常用的存储配置

## 功能特性

- ✅ localStorage 完整管理
- ✅ sessionStorage 编辑
- ✅ Cookies 管理
- ✅ IndexedDB 查看
- ✅ JSON 格式化/压缩
- ✅ Base64 编码/解码
- ✅ 配置文件保存/加载
- ✅ 数据备份/恢复
- ✅ 多语言支持（中文/英文）
- ✅ 明亮/暗黑主题

## 故障排除

### 扩展无法加载
- 确保已开启开发者模式
- 检查dist文件夹是否包含所有必要文件
- 尝试重新加载扩展

### 无法访问网站数据
- 确保扩展有足够的权限
- 检查网站是否使用HTTPS
- 刷新目标网页后重试

### 功能异常
- 检查浏览器控制台是否有错误信息
- 尝试重新安装扩展
- 确保Chrome版本支持Manifest V3

## 技术信息

- **版本**: ${this.version}
- **Manifest版本**: 3
- **最低Chrome版本**: 88+
- **构建日期**: ${new Date().toLocaleDateString()}

## 联系支持

如果遇到问题，请检查：
1. Chrome版本是否为88+
2. 是否已开启开发者模式
3. dist文件夹是否完整

---
Storage Manager Pro - 专业的浏览器存储管理工具
`;

    const guidePath = path.join(this.packagePath, `installation-guide-v${this.version}.md`);
    fs.writeFileSync(guidePath, guide);
    
    console.log(`✅ 安装指南已保存: installation-guide-v${this.version}.md`);
    return guidePath;
  }

  /**
   * 运行完整的打包验证流程
   */
  async package() {
    try {
      console.log('🚀 开始扩展打包验证...\n');
      console.log(`版本: ${this.version}`);
      console.log(`构建目录: ${this.distPath}`);
      console.log(`输出目录: ${this.packagePath}\n`);

      // 验证构建
      const files = this.validateBuild();
      const manifest = this.validateManifest();

      // 创建包目录
      this.createPackageDirectory();

      // 生成发布说明
      const releaseNotes = this.generateReleaseNotes(files);

      // 创建安装指南
      const guidePath = this.createInstallationGuide();

      // 输出摘要
      console.log('\n📊 打包验证摘要');
      console.log('='.repeat(60));
      console.log(`扩展名称: ${manifest.name}`);
      console.log(`版本: ${manifest.version}`);
      console.log(`Manifest版本: ${manifest.manifest_version}`);
      console.log(`总文件数: ${files.length}`);
      console.log(`总大小: ${(releaseNotes.totalSize / 1024).toFixed(2)} KB`);
      console.log('='.repeat(60));

      console.log('\n📄 文件清单:');
      files.forEach(file => {
        console.log(`  ${file.name}: ${file.sizeKB} KB`);
      });

      console.log('\n📦 发布准备完成！');
      console.log('下一步操作：');
      console.log('1. 手动创建ZIP包：压缩dist文件夹内容');
      console.log('2. 测试安装：按照安装指南测试扩展');
      console.log('3. 发布：上传到Chrome Web Store');
      console.log(`\n📁 文档位置: ${this.packagePath}`);

      return {
        files,
        releaseNotes,
        manifest,
        guidePath
      };

    } catch (error) {
      console.error('❌ 打包验证失败:', error.message);
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const packager = new SimplePackager();
  packager.package().catch(console.error);
}

export default SimplePackager;

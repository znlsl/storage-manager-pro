#!/usr/bin/env node

/**
 * Storage Manager Pro - 扩展打包脚本
 * 创建可发布的Chrome扩展包
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExtensionPackager {
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
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.distPath, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      throw new Error(`缺少必要文件: ${missingFiles.join(', ')}`);
    }

    console.log('✅ 所有必要文件都存在');
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
   * 创建ZIP包
   */
  async createZipPackage() {
    console.log('📦 创建ZIP包...');
    
    const zipFileName = `storage-manager-pro-v${this.version}.zip`;
    const zipFilePath = path.join(this.packagePath, zipFileName);
    
    // 如果文件已存在，删除它
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
    }

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // 最高压缩级别
      });

      output.on('close', () => {
        const sizeKB = (archive.pointer() / 1024).toFixed(2);
        console.log(`✅ ZIP包创建成功: ${zipFileName} (${sizeKB} KB)`);
        resolve(zipFilePath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // 添加dist目录中的所有文件
      archive.directory(this.distPath, false);

      archive.finalize();
    });
  }

  /**
   * 创建CRX包（需要私钥）
   */
  async createCrxPackage() {
    console.log('📦 检查CRX包创建条件...');
    
    const keyPath = path.join(this.projectRoot, 'private-key.pem');
    
    if (!fs.existsSync(keyPath)) {
      console.log('⚠️ 未找到私钥文件，跳过CRX包创建');
      console.log('💡 要创建CRX包，请将私钥保存为 private-key.pem');
      return null;
    }

    // 这里可以添加CRX包创建逻辑
    // 需要使用chrome-extension-tools或类似工具
    console.log('ℹ️ CRX包创建功能待实现');
    return null;
  }

  /**
   * 生成发布说明
   */
  generateReleaseNotes() {
    console.log('📝 生成发布说明...');
    
    const releaseNotes = {
      version: this.version,
      buildDate: new Date().toISOString(),
      files: [],
      checksums: {},
      size: {
        total: 0,
        breakdown: {}
      }
    };

    // 收集文件信息
    const files = fs.readdirSync(this.distPath, { recursive: true });
    
    files.forEach(file => {
      if (typeof file === 'string') {
        const filePath = path.join(this.distPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          releaseNotes.files.push({
            name: file,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
          
          releaseNotes.size.total += stats.size;
          
          const ext = path.extname(file).toLowerCase() || 'other';
          releaseNotes.size.breakdown[ext] = (releaseNotes.size.breakdown[ext] || 0) + stats.size;
        }
      }
    });

    // 保存发布说明
    const releaseNotesPath = path.join(this.packagePath, `release-notes-v${this.version}.json`);
    fs.writeFileSync(releaseNotesPath, JSON.stringify(releaseNotes, null, 2));
    
    console.log(`✅ 发布说明已保存: release-notes-v${this.version}.json`);
    return releaseNotes;
  }

  /**
   * 运行完整的打包流程
   */
  async package() {
    try {
      console.log('🚀 开始扩展打包流程...\n');
      console.log(`版本: ${this.version}`);
      console.log(`构建目录: ${this.distPath}`);
      console.log(`输出目录: ${this.packagePath}\n`);

      // 验证构建
      this.validateBuild();
      const manifest = this.validateManifest();

      // 创建包目录
      this.createPackageDirectory();

      // 创建ZIP包
      const zipPath = await this.createZipPackage();

      // 尝试创建CRX包
      const crxPath = await this.createCrxPackage();

      // 生成发布说明
      const releaseNotes = this.generateReleaseNotes();

      // 输出摘要
      console.log('\n📊 打包摘要');
      console.log('='.repeat(50));
      console.log(`扩展名称: ${manifest.name}`);
      console.log(`版本: ${manifest.version}`);
      console.log(`Manifest版本: ${manifest.manifest_version}`);
      console.log(`总文件数: ${releaseNotes.files.length}`);
      console.log(`总大小: ${(releaseNotes.size.total / 1024).toFixed(2)} KB`);
      console.log(`ZIP包: ${path.basename(zipPath)}`);
      if (crxPath) {
        console.log(`CRX包: ${path.basename(crxPath)}`);
      }
      console.log('='.repeat(50));

      console.log('\n✅ 扩展打包完成！');
      console.log(`📁 包文件位置: ${this.packagePath}`);

      return {
        zipPath,
        crxPath,
        releaseNotes,
        manifest
      };

    } catch (error) {
      console.error('❌ 打包失败:', error.message);
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const packager = new ExtensionPackager();
  packager.package().catch(console.error);
}

export default ExtensionPackager;

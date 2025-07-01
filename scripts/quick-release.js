#!/usr/bin/env node

/**
 * Storage Manager Pro - 快速发布脚本
 * 
 * 简化版发布流程，适用于小版本更新
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function step(message) {
  log(`🚀 ${message}`, 'cyan');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 执行命令
function exec(command) {
  try {
    // 扩展 PATH 以包含常见的 Homebrew 路径
    const extendedEnv = {
      ...process.env,
      PATH: [
        process.env.PATH,
        '/opt/homebrew/bin',
        '/usr/local/bin',
        '/usr/bin',
        '/bin'
      ].filter(Boolean).join(':')
    };

    execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      env: extendedEnv
    });
  } catch (err) {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

// 读取版本号
function getCurrentVersion() {
  const packagePath = path.resolve(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

// 主函数
function main() {
  log('\n⚡ Storage Manager Pro - Quick Release', 'cyan');
  log('====================================\n', 'cyan');
  
  const version = getCurrentVersion();
  info(`Current version: ${version}`);
  
  // 构建项目
  step('Building project...');
  exec('npm run build');
  success('Build completed');
  
  // 创建 ZIP 包
  step('Creating ZIP package...');
  const zipName = `storage-manager-pro-v${version}.zip`;
  
  // 删除旧的 ZIP 文件
  if (fs.existsSync(path.resolve(rootDir, zipName))) {
    fs.unlinkSync(path.resolve(rootDir, zipName));
  }
  
  exec(`zip -r ${zipName} dist/`);
  success(`Created ${zipName}`);
  
  // 完成
  log('\n🎉 Quick release completed!', 'green');
  success(`ZIP package: ${zipName}`);
  info('Ready for Chrome Web Store upload');
}

main();

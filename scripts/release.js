#!/usr/bin/env node

/**
 * Storage Manager Pro - 自动化发布脚本
 * 
 * 功能：
 * 1. 构建生产版本
 * 2. 同步版本号
 * 3. 创建 ZIP 打包文件
 * 4. 提交代码变更
 * 5. 创建 Git tag
 * 6. 推送到远程仓库
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
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function step(message) {
  log(`\n🚀 ${message}`, 'cyan');
}

// 执行命令
function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      ...options,
    });
    return result;
  } catch (err) {
    error(`Command failed: ${command}`);
    error(err.message);
    process.exit(1);
  }
}

// 读取 JSON 文件
function readJSON(filePath) {
  try {
    const content = fs.readFileSync(path.resolve(rootDir, filePath), 'utf8');
    return JSON.parse(content);
  } catch (err) {
    error(`Failed to read ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

// 写入 JSON 文件
function writeJSON(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(path.resolve(rootDir, filePath), content + '\n');
  } catch (err) {
    error(`Failed to write ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

// 验证版本号格式
function validateVersion(version) {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}

// 检查工作目录是否干净
function checkWorkingDirectory() {
  try {
    const status = execSync('git status --porcelain', { 
      cwd: rootDir, 
      encoding: 'utf8',
      stdio: 'pipe',
    });
    
    if (status.trim()) {
      warning('Working directory has uncommitted changes:');
      console.log(status);
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      return new Promise((resolve) => {
        rl.question('Do you want to continue? (y/N): ', (answer) => {
          rl.close();
          if (answer.toLowerCase() !== 'y') {
            info('Release cancelled.');
            process.exit(0);
          }
          resolve();
        });
      });
    }
  } catch (err) {
    warning('Could not check git status. Continuing...');
  }
}

// 获取当前版本
function getCurrentVersion() {
  const packageJson = readJSON('package.json');
  return packageJson.version;
}

// 更新版本号
function updateVersion(newVersion) {
  step(`Updating version to ${newVersion}`);
  
  // 更新 package.json
  const packageJson = readJSON('package.json');
  packageJson.version = newVersion;
  writeJSON('package.json', packageJson);
  success('Updated package.json');
  
  // 更新 manifest.json
  const manifestJson = readJSON('public/manifest.json');
  manifestJson.version = newVersion;
  writeJSON('public/manifest.json', manifestJson);
  success('Updated public/manifest.json');
}

// 构建项目
function buildProject() {
  step('Building project');
  exec('npm run build');
  success('Build completed');
}

// 创建 ZIP 包
function createZipPackage(version) {
  step('Creating ZIP package');
  
  const zipName = `storage-manager-pro-v${version}.zip`;
  const zipPath = path.resolve(rootDir, zipName);
  
  // 删除旧的 ZIP 文件
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  exec(`zip -r ${zipName} dist/`);
  success(`Created ${zipName}`);
  
  return zipName;
}

// 提交更改
function commitChanges(version, zipName) {
  step('Committing changes');

  // 添加所有文件，包括 ZIP 文件
  exec('git add .');
  exec(`git add ${zipName}`);
  exec(`git commit -m "chore: release v${version}

- Updated version to ${version}
- Built production assets
- Updated documentation
- Added release package ${zipName}"`);

  success('Changes committed');
}

// 创建 Git tag
function createTag(version) {
  step('Creating Git tag');
  
  const tagName = `v${version}`;
  exec(`git tag -a ${tagName} -m "Release ${tagName}"`);
  success(`Created tag ${tagName}`);
}

// 推送到远程仓库
function pushToRemote(version) {
  step('Pushing to remote repository');

  exec('git push origin main');
  exec(`git push origin v${version}`);
  success('Pushed to remote repository');
}

// 创建 GitHub Release
function createGitHubRelease(version, zipName) {
  step('Creating GitHub Release');

  try {
    // 检查是否安装了 gh CLI
    exec('gh --version', { stdio: 'pipe' });

    // 读取 CHANGELOG 获取发布说明
    const changelogPath = path.resolve(rootDir, 'CHANGELOG.md');
    let releaseNotes = `Release v${version}`;

    if (fs.existsSync(changelogPath)) {
      const changelog = fs.readFileSync(changelogPath, 'utf8');
      const versionMatch = changelog.match(new RegExp(`## \\[${version}\\][\\s\\S]*?(?=## \\[|$)`));
      if (versionMatch) {
        releaseNotes = versionMatch[0].replace(`## [${version}]`, '').trim();
      }
    }

    // 创建 GitHub Release 并上传 ZIP 文件
    exec(`gh release create v${version} ${zipName} --title "Release v${version}" --notes "${releaseNotes.replace(/"/g, '\\"')}" --latest`);
    success(`Created GitHub Release v${version} with ${zipName}`);

  } catch (err) {
    warning('GitHub CLI not found or release creation failed');
    warning('Please manually create GitHub Release and upload ZIP file');
    info(`ZIP file location: ${zipName}`);
  }
}

// 移动 ZIP 文件到 releases 目录
function organizeReleaseFiles(zipName) {
  step('Organizing release files');

  const releasesDir = path.resolve(rootDir, 'releases');

  // 创建 releases 目录
  if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir, { recursive: true });
  }

  // 移动 ZIP 文件到 releases 目录
  const sourcePath = path.resolve(rootDir, zipName);
  const targetPath = path.resolve(releasesDir, zipName);

  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, targetPath);
    success(`Moved ${zipName} to releases/ directory`);
    return path.relative(rootDir, targetPath);
  }

  return zipName;
}

// 主函数
async function main() {
  log('\n🎯 Storage Manager Pro - Release Script', 'bright');
  log('=====================================\n', 'bright');
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  const options = {
    skipGitHub: args.includes('--skip-github'),
    skipPush: args.includes('--skip-push'),
    dryRun: args.includes('--dry-run'),
  };

  // 过滤出版本号（排除选项参数）
  let newVersion = args.find(arg => !arg.startsWith('--'));
  
  // 检查工作目录
  await checkWorkingDirectory();
  
  // 获取当前版本
  const currentVersion = getCurrentVersion();
  info(`Current version: ${currentVersion}`);
  
  // 如果没有提供版本号，自动递增
  if (!newVersion) {
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2]++; // 递增补丁版本
    newVersion = versionParts.join('.');
    info(`Auto-incrementing to: ${newVersion}`);
  }
  
  // 验证版本号
  if (!validateVersion(newVersion)) {
    error(`Invalid version format: ${newVersion}`);
    error('Version should be in format: x.y.z');
    process.exit(1);
  }
  
  // 检查版本是否比当前版本新
  function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    return 0;
  }

  if (compareVersions(newVersion, currentVersion) <= 0) {
    error(`New version (${newVersion}) must be greater than current version (${currentVersion})`);
    process.exit(1);
  }
  
  try {
    if (options.dryRun) {
      info('🧪 Dry run mode - no actual changes will be made');
    }

    // 执行发布流程
    if (!options.dryRun) {
      updateVersion(newVersion);
    } else {
      info(`Would update version to ${newVersion}`);
    }

    buildProject();
    const zipName = createZipPackage(newVersion);

    // 组织发布文件
    const finalZipPath = organizeReleaseFiles(zipName);

    // Git 操作
    if (!options.dryRun) {
      commitChanges(newVersion, finalZipPath);
      createTag(newVersion);

      if (!options.skipPush) {
        pushToRemote(newVersion);
      } else {
        warning('Skipping push to remote repository');
      }

      // 创建 GitHub Release
      if (!options.skipGitHub) {
        createGitHubRelease(newVersion, finalZipPath);
      } else {
        warning('Skipping GitHub Release creation');
      }
    } else {
      info('Would commit changes and create Git tag');
      info('Would push to remote repository');
      info('Would create GitHub Release');
    }

    // 发布成功
    log('\n🎉 Release completed successfully!', 'green');
    log('================================\n', 'green');
    success(`Version: ${newVersion}`);
    success(`ZIP package: ${finalZipPath}`);
    success(`Git tag: v${newVersion}`);
    success('Changes pushed to remote repository');
    success('GitHub Release created (if gh CLI available)');

    info('\nNext steps:');
    info('1. Upload the ZIP file to Chrome Web Store');
    info('2. Verify GitHub release was created correctly');
    info('3. Update any external documentation');
    
  } catch (err) {
    error(`Release failed: ${err.message}`);
    process.exit(1);
  }
}

// 运行脚本
main().catch((err) => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});

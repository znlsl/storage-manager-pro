#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');

// 移动 HTML 文件到正确位置
const htmlSource = path.join(distDir, 'src/tab/index.html');
const htmlTarget = path.join(distDir, 'tab.html');

if (fs.existsSync(htmlSource)) {
  fs.copyFileSync(htmlSource, htmlTarget);
  console.log('✓ Moved tab.html to correct location');
}

// 清理不需要的目录
const srcDir = path.join(distDir, 'src');
if (fs.existsSync(srcDir)) {
  fs.rmSync(srcDir, { recursive: true, force: true });
  console.log('✓ Cleaned up src directory');
}

// 验证必要文件存在
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'tab.html',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ Missing required file: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✓ Found: ${file}`);
  }
});

if (allFilesExist) {
  console.log('\n🎉 Build completed successfully! Extension is ready for loading.');
  console.log(`📁 Extension files are in: ${distDir}`);
} else {
  console.error('\n❌ Build incomplete - some required files are missing.');
  process.exit(1);
}

# Storage Manager Pro

[English](README.md) | 中文版

🚀 **专业级浏览器存储管理工具** - 基于 React + TypeScript + Vite 重构的现代化 Chrome 扩展

[![Version](https://img.shields.io/badge/version-2.1.2-blue.svg)](https://github.com/your-repo/storage-manager-pro)
[![Manifest](https://img.shields.io/badge/manifest-v3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5+-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/vite-5+-646cff.svg)](https://vitejs.dev/)

📋 **[查看更新日志](CHANGELOG_ZH.md)** | 🚀 **[快速开始](#-快速开始)** | 📖 **[使用指南](#-使用指南)**

## ✨ 核心优势
### 🎯 **智能数据处理**
- **一键格式化JSON** - 自动美化复杂的JSON数据，提升可读性
- **智能压缩** - 快速压缩JSON数据，节省存储空间
- **Base64编码/解码** - 支持Base64格式的编码和解码，处理二进制数据
- **UTF-8编码/解码** - 处理Unicode字符编码，支持多语言文本
- **语法高亮** - 清晰展示数据结构，快速定位问题

### 🔧 **专业编辑体验**
- **可调整编辑器** - 支持文本区域大小调整，适应不同内容长度
- **实时预览** - 编辑时即时查看效果
- **Pin固定功能** - 固定弹窗保持打开状态，提升操作效率
- **批量操作** - 支持快速清空、批量删除等高效操作

### 💾 **强大的数据管理**
- **配置文件系统** - 保存和切换不同网站的完整配置
- **Cookie账户管理** - 轻松切换不同登录状态
- **LocalStorage备份** - 数据安全有保障，支持一键恢复

### 🔍 **高效查找**
- **实时搜索** - 快速定位目标数据项
- **多存储类型支持** - 统一管理 LocalStorage、SessionStorage、Cookies、IndexedDB

## 🎨 **界面特色**

- **现代化UI设计** - 简洁美观的用户界面
![主界面](./screenshot/image1.png)
![主题切换](./screenshot/image2.png)
- **响应式布局** - 完美适配各种屏幕尺寸
- **直观操作** - 所见即所得的编辑体验
![JSON格式化](./screenshot/image3.png)
![全屏编辑](./screenshot/image4.png)

## 🚀 **快速开始**

### 💡 **核心功能演示**

#### 📝 **多格式数据处理**
```javascript
// JSON格式化
{"user":{"name":"张三"}} → 美化显示

// Base64编码/解码
"Hello World" ↔ "SGVsbG8gV29ybGQ="

// UTF-8 URL编码/解码
"你好" ↔ "%E4%BD%A0%E5%A5%BD"
```

#### 🔄 **配置文件管理**
- **保存配置** - 一键保存当前网站的所有存储数据
- **快速切换** - 在不同配置间无缝切换
- **批量恢复** - 同时恢复 LocalStorage 和 Cookies

#### 👤 **Cookie账户切换**
- 保存不同登录状态的 Cookie 配置
- 一键切换测试账户和正式账户
- 支持跨域名的账户管理

## 📖 **使用指南**

### 基础操作
1. **安装扩展** → 点击工具栏图标 → 立即查看当前页面存储数据
2. **编辑数据** → 点击"编辑"按钮 → 使用格式化工具 → 保存更改
3. **搜索定位** → 输入关键词 → 快速找到目标数据项

### 高级功能
- **备份重要数据** - 防止意外丢失，支持带描述的命名备份
- **配置文件管理** - 为不同环境创建专用配置
- **批量操作** - 快速清理测试数据或重置状态

## 📦 **安装方式**

### 开发者安装
1. 下载项目文件到本地
2. 打开 Chrome 扩展页面 (`chrome://extensions/`)
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"，选择项目文件夹
5. 扩展图标出现在工具栏，安装完成！

## ❓ **常见问题**

**Q: JSON格式化功能支持哪些数据类型？**
A: 支持所有标准JSON格式，包括嵌套对象、数组等复杂结构，自动检测并美化显示。

**Q: 配置文件可以包含哪些内容？**
A: 可以选择性包含 LocalStorage 数据和 Cookies，支持跨域名的配置管理。

**Q: 数据安全性如何保障？**
A: 所有数据仅存储在本地浏览器中，不会上传到任何服务器，完全保护您的隐私。

## 🔒 **隐私保护**

- ✅ 100% 本地存储，无数据上传
- ✅ 仅在授权网站运行
- ✅ 开源透明，代码可审查

## 📊 **技术规格**

- **版本**: 2.1.2 | **架构**: React + TypeScript + Vite | **标准**: Manifest V3
- **兼容性**: Chrome 88+ | **构建体积**: ~360KB | **加载时间**: <500ms

---

⭐ **如果这个工具对您有帮助，请给我们一个Star！**
🐛 **发现问题？** [提交Issue](https://github.com/jasonwong1991/storage-manager-pro/issues)
💡 **有建议？** [参与讨论](https://github.com/jasonwong1991/storage-manager-pro/discussions)

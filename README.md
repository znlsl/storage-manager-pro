
# Storage Manager Pro

English | [中文版](README_ZH.md)

🚀 **Professional Browser Storage Management Tool** - Modern Chrome extension rebuilt with React + TypeScript + Vite

[![Version](https://img.shields.io/badge/version-2.1.7-blue.svg)](https://github.com/your-repo/storage-manager-pro)
[![Manifest](https://img.shields.io/badge/manifest-v3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5+-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/vite-5+-646cff.svg)](https://vitejs.dev/)

📋 **[View Changelog](CHANGELOG.md)** | 🚀 **[Quick Start](#-quick-start)** | 📖 **[User Guide](#-user-guide)**

## ✨ **Core Advantages**

### 🎯 **Smart Data Processing**
- **One-Click JSON Formatting** - Automatically beautify complex JSON data for better readability
- **Intelligent Compression** - Quickly compress JSON data to save storage space
- **Base64 Encoding/Decoding** - Support Base64 format encoding and decoding for binary data
- **UTF-8 Encoding/Decoding** - Handle Unicode character encoding, support multilingual text
- **Syntax Highlighting** - Clear data structure display for quick issue identification

### 🔧 **Professional Editing Experience**
- **Resizable Editor** - Adjustable text area size to accommodate different content lengths
- **Real-time Preview** - Instant effect viewing while editing
- **Pin Feature** - Pin popup to keep it open for improved operation efficiency
- **Batch Operations** - Support for quick clear, batch delete, and other efficient operations

### 💾 **Powerful Data Management**
- **Profile System** - Save and switch complete configurations for different websites
- **Cookie Account Management** - Easily switch between different login states
- **LocalStorage Backup** - Data security guaranteed with one-click recovery support

### 🔍 **Efficient Search**
- **Real-time Search** - Quickly locate target data items
- **Multi-Storage Support** - Unified management of LocalStorage, SessionStorage, Cookies, IndexedDB

## 🎨 **Interface Features**

- **Modern UI Design** - Clean and beautiful user interface
![主界面](./screenshot/image1.png)
![主题切换](./screenshot/image2.png)
- **Responsive Layout** - Perfect adaptation to various screen sizes
- **Intuitive Operations** - WYSIWYG editing experience
![JSON格式化](./screenshot/image3.png)
![全屏编辑](./screenshot/image4.png)

## 🚀 **Quick Start**

### 💡 **Core Feature Demo**

#### 📝 **Multi-Format Data Processing**
```javascript
// JSON Formatting
{"user":{"name":"John"}} → Beautified display

// Base64 Encoding/Decoding
"Hello World" ↔ "SGVsbG8gV29ybGQ="

// UTF-8 URL Encoding/Decoding
"你好" ↔ "%E4%BD%A0%E5%A5%BD"
```

#### 🔄 **Profile Management**
- **Save Configuration** - One-click save of all storage data for current website
- **Quick Switch** - Seamless switching between different configurations
- **Batch Recovery** - Simultaneously restore LocalStorage and Cookies

#### 👤 **Cookie Account Switching**
- Save Cookie configurations for different login states
- One-click switch between test and production accounts
- Support cross-domain account management

## 📖 **User Guide**

### 📋 Table of Contents

1. [Installation Guide](#-installation-guide)
2. [Basic Operations](#-basic-operations)
3. [Core Features](#-core-features)
4. [Advanced Features](#-advanced-features)
5. [FAQ](#-faq)
6. [Best Practices](#-best-practices)

### 🚀 Installation Guide

#### Developer Installation (Recommended)

1. **Download Project**
   ```bash
   git clone https://github.com/jasonwong1991/storage-manager-pro.git
   cd storage-manager-pro
   ```

2. **Build Extension**
   ```bash
   npm install
   npm run build
   ```

3. **Load into Browser**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the project's `dist` folder
   - Extension installed successfully!

#### Verify Installation

After successful installation, you'll see the Storage Manager Pro icon 🚀 in your browser toolbar.

### 🎯 Basic Operations

#### Launch Extension

1. **Click Toolbar Icon**
   - Click the Storage Manager Pro icon on any webpage
   - Extension opens in a new tab

2. **Select Domain**
   - Choose the website to manage from the "Current Domain" dropdown
   - Supports all currently open tab domains
   - Can manually input domain names

#### Data Viewing

1. **Storage Tabs**
   - **LocalStorage**: View and manage local storage data
   - **SessionStorage**: Manage session-specific data
   - **Cookies**: Complete cookie management
   - **IndexedDB**: Browse database structures and data

2. **Data Display**
   - Automatic JSON formatting for complex data
   - Syntax highlighting for better readability
   - Search and filter capabilities

### 🔧 Core Features

#### JSON Data Processing

1. **Format JSON**
   - Click "Format JSON" button on any JSON value
   - Automatic beautification with proper indentation
   - Syntax error detection and highlighting

2. **Compress JSON**
   - Remove unnecessary whitespace
   - Minimize data size for storage efficiency

3. **Encoding Tools**
   - **Base64**: Encode/decode binary data
   - **UTF-8 URL**: Handle URL encoding
   - **UTF-8 Hex**: Hexadecimal encoding
   - **Unicode**: Unicode character encoding
   - **HTML Entity**: HTML entity encoding

#### Data Editing

1. **Edit Items**
   - Click "Edit" button on any storage item
   - Full-screen editor with formatting tools
   - Real-time validation and preview

2. **Add New Items**
   - Click "Add Item" to create new entries
   - Support for all data types
   - Automatic validation

3. **Delete Items**
   - Individual item deletion with confirmation
   - Bulk operations for efficiency
   - Undo protection

### 🚀 Advanced Features

#### Profile Management

1. **Save Profiles**
   - Create complete snapshots of storage data
   - Include LocalStorage and Cookies selectively
   - Add descriptions for easy identification

2. **Load Profiles**
   - Restore saved configurations instantly
   - Preview profile contents before loading
   - Backup current data before restoration

3. **Export/Import**
   - Export profiles as JSON files
   - Import configurations from files
   - Share configurations between devices

#### Cookie Account Management

1. **Save Accounts**
   - Capture current login state as named accounts
   - Include all relevant cookies
   - Add descriptions for context

2. **Switch Accounts**
   - Instantly switch between different login states
   - Perfect for testing multiple user scenarios
   - Automatic cookie replacement

3. **Account Organization**
   - Group accounts by domain
   - View account details and cookie counts
   - Delete unused accounts

#### Backup & Restore

1. **Create Backups**
   - Named backups with timestamps
   - Selective content inclusion
   - Automatic compression

2. **Restore Data**
   - Choose from available backups
   - Preview backup contents
   - Confirmation before restoration

### ❓ FAQ

**Q: What data types does JSON formatting support?**
A: Supports all standard JSON formats, including nested objects, arrays, and other complex structures with automatic detection and beautification.

**Q: What can be included in profiles?**
A: You can selectively include LocalStorage data and Cookies, with support for cross-domain configuration management.

**Q: How is data security ensured?**
A: All data is stored only in your local browser, never uploaded to any servers, completely protecting your privacy.

**Q: Can I use this on any website?**
A: Yes, the extension works on all websites. Simply select the domain you want to manage from the dropdown.

**Q: What's the difference between profiles and accounts?**
A: Profiles save complete storage configurations (LocalStorage + Cookies), while accounts specifically save Cookie-based login states.

**Q: How do I backup my data?**
A: Use the backup feature in LocalStorage tab, or export profiles for complete configuration backups.

### 🎯 Best Practices

#### Development Workflow

1. **Environment Separation**
   - Create separate profiles for development, staging, and production
   - Use account switching for different user roles
   - Regular backups before major changes

2. **Data Management**
   - Use descriptive names for profiles and accounts
   - Regular cleanup of test data
   - Export important configurations

3. **Testing Scenarios**
   - Save different user states as accounts
   - Test with various data configurations
   - Verify data persistence across sessions

#### Security Considerations

1. **Sensitive Data**
   - Be cautious with authentication tokens
   - Don't share profiles containing sensitive information
   - Regular cleanup of expired sessions

2. **Privacy Protection**
   - All data remains local to your browser
   - No external data transmission
   - Full control over your information

## 🔒 **Privacy Protection**

- ✅ 100% local storage, no data uploads
- ✅ Runs only on authorized websites
- ✅ Open source and transparent, code is auditable

## 📊 **Technical Specifications**

- **Version**: 2.1.7 | **Architecture**: React + TypeScript + Vite | **Standard**: Manifest V3
- **Compatibility**: Chrome 88+ | **Bundle Size**: ~360KB | **Load Time**: <500ms

---

⭐ **If this tool helps you, please give us a Star!**
🐛 **Found a bug?** [Submit Issue](https://github.com/jasonwong1991/storage-manager-pro/issues)
💡 **Have suggestions?** [Join Discussion](https://github.com/jasonwong1991/storage-manager-pro/discussions)

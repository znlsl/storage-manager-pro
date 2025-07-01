# Storage Manager Pro User Guide

## 📋 Table of Contents

1. [Installation Guide](#-installation-guide)
2. [Basic Operations](#-basic-operations)
3. [Core Features](#-core-features)
4. [Advanced Features](#-advanced-features)
5. [FAQ](#-faq)
6. [Best Practices](#-best-practices)

## 🚀 Installation Guide

### Developer Installation (Recommended)

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

### Verify Installation

After successful installation, you'll see the Storage Manager Pro icon 🚀 in your browser toolbar.

## 🎯 Basic Operations

### Launch Extension

1. **Click Toolbar Icon**
   - Click the Storage Manager Pro icon on any webpage
   - Extension opens in a new tab

2. **Select Domain**
   - Choose the website to manage from the "Current Domain" dropdown
   - Supports all currently open tab domains
   - Manual domain input also supported

3. **Choose Storage Type**
   - 📦 **LocalStorage** - Local storage data
   - 🔄 **SessionStorage** - Session storage data
   - 🍪 **Cookies** - Cookie data
   - 💾 **IndexedDB** - Indexed database

## 🔧 Core Features

### LocalStorage Management

#### View Data
- All LocalStorage items displayed in list format
- Shows key names, values, and action buttons
- JSON data highlighted with special formatting

#### Add New Items
1. Click "➕ Add" button
2. Enter key name and value
3. Click "Save" to complete addition

#### Edit Existing Items
1. Click "✏️ Edit" button on the right side of an item
2. Modify value in the popup editor
3. Supports fullscreen editing mode
4. Click "Save" to apply changes

#### JSON Formatting
1. For JSON format data, click "🎨 Format" button
2. Data automatically beautified for better readability
3. Supports compress/expand toggle

### SessionStorage Management

SessionStorage operations are identical to LocalStorage:
- View, add, edit, delete functions are the same
- Data only valid for current session
- Data automatically cleared when tab is closed

### Cookie Management

#### View Cookies
- Displays all Cookie names, values, domains, paths, etc.
- Supports viewing Cookie expiration time and security attributes

#### Add Cookies
1. Click "➕ Add Cookie" button
2. Fill in Cookie information:
   - **Name**: Cookie key name
   - **Value**: Cookie value
   - **Domain**: Scope domain (auto-filled)
   - **Path**: Scope path (default /)
   - **Expiration**: Optional setting
   - **Security**: HttpOnly, Secure, SameSite

#### Edit Cookies
1. Click "✏️ Edit" button
2. Modify Cookie attributes
3. Changes take effect immediately after saving

#### Account Management
1. Click "👤 Account Management" button
2. Save all Cookies for current login state
3. Supports quick switching between different accounts
4. Useful for testing different user permissions

### IndexedDB Viewing

#### Database List
- Shows all IndexedDB databases under current domain
- Displays database name, version, and object store count

#### Object Stores
- View object stores in each database
- Shows store name, index information, and record count

#### Data Preview
- View sample data in stores
- Preview mode for large data sets
- Supports data size display and performance optimization

## 🎨 Advanced Features

### Encoding/Decoding Tools

#### Base64 Encode/Decode
1. Select item containing Base64 data
2. Click "🔓 Decode" button
3. View decoded original content
4. Can also encode text to Base64 format

#### UTF-8 Encode/Decode
1. Supports UTF-8 character encoding and decoding
2. Handles multilingual text data
3. Displays hexadecimal encoding results

### Search Functionality

#### Real-time Search
1. Enter keywords in search box
2. Real-time filtering of matching storage items
3. Supports fuzzy search of keys and values
4. Search results highlight matching content

#### Advanced Search
- Supports regular expression search
- Case sensitivity options
- Filter by data type

### Backup & Restore

#### Data Backup
1. Click "💾 Backup" button
2. Select data types to backup
3. Enter backup name and description
4. Download backup file locally

#### Data Restore
1. Click "Restore" button
2. Select backup file
3. Preview data to restore
4. Confirm restore operation

### Configuration File Management

#### Save Configuration
1. Click "Save Configuration File" in settings
2. Enter configuration file name
3. Select data types to include
4. Save as JSON format

#### Load Configuration
1. Select saved configuration file
2. Preview configuration content
3. Selectively restore data
4. Supports cross-domain usage

### Theme Settings

#### Theme Switching
- **Light Mode**: Suitable for daytime use
- **Dark Mode**: Suitable for nighttime use
- **Auto Mode**: Follows system theme

#### Language Settings
- Chinese interface
- English interface
- Auto-detect browser language

## ❓ FAQ

### Extension Won't Load
**Problem**: Extension doesn't work properly after installation
**Solution**:
1. Ensure developer mode is enabled
2. Check if manifest.json file is correct
3. Check browser extension management page for errors
4. Rebuild and reload extension

### Data Not Displaying
**Problem**: No storage data visible when opening extension
**Solution**:
1. Confirm webpage actually has storage data
2. Check if domain selection is correct
3. Refresh page and retry
4. Check browser console for errors

### Cookie Operations Fail
**Problem**: Cannot add or modify Cookies
**Solution**:
1. Check Cookie domain format is correct
2. Confirm SameSite attribute settings
3. Verify Cookie size limits
4. Check browser security policies

### Performance Issues
**Problem**: Extension responds slowly when handling large amounts of data
**Solution**:
1. Use search function to filter data
2. Enable data preview mode
3. Process large datasets in batches
4. Clean up unnecessary storage data

## 💡 Best Practices

### Data Management
1. **Regular Backup of Important Data**
   - Create backups for critical configurations
   - Use descriptive backup names
   - Regularly clean up expired backups

2. **Organize Storage Structure Properly**
   - Use meaningful key names
   - Avoid storing oversized data
   - Regularly clean up unused data

### Development Debugging
1. **Use JSON Formatting**
   - Improve readability of complex data
   - Easy to spot data structure issues
   - Support quick error location

2. **Utilize Search Function**
   - Quickly locate specific data
   - Use keywords for filtering
   - Improve debugging efficiency

### Security Considerations
1. **Sensitive Data Handling**
   - Avoid storing sensitive information in LocalStorage
   - Use appropriate Cookie security attributes
   - Regularly clean up debug data

2. **Permission Management**
   - Only use extension on necessary domains
   - Be aware of cross-domain data access
   - Protect user privacy

### Performance Optimization
1. **Data Volume Control**
   - Avoid storing oversized individual items
   - Use pagination or lazy loading
   - Regularly clean up historical data

2. **Operation Efficiency**
   - Use batch operation features
   - Utilize shortcuts for efficiency
   - Properly use caching mechanisms

---

## 🔗 Related Links

- [Project Homepage](https://github.com/jasonwong1991/storage-manager-pro)
- [Issue Reporting](https://github.com/jasonwong1991/storage-manager-pro/issues)
- [Feature Requests](https://github.com/jasonwong1991/storage-manager-pro/discussions)
- [Changelog](CHANGELOG.md)

## 📞 Technical Support

If you encounter issues while using the extension, you can get help through:

1. Consult this tutorial and FAQ section
2. Submit Issues on GitHub
3. Participate in community discussions
4. Check project documentation

---

**Thank you for using Storage Manager Pro!** 🚀

If this tool helps you, please give us a ⭐ Star!

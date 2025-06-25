# Storage Manager Pro

[中文版](README.md) | English

Storage Manager Pro is a powerful Chrome extension for managing web page localStorage, sessionStorage, Cookies, and IndexedDB.

## Latest Updates (June 2025)

- **UI Optimization**:
  - Fixed the issue where confirm and cancel buttons were out of bounds and unclickable when editing localStorage
  - Optimized cookie editing interface, resolved layout issues with confirm/cancel buttons being too close to edges
  - Improved modal display to ensure buttons are properly visible across different screen sizes
  - Optimized button text centering
  - Enhanced editing area user experience with resizable text areas

## Features

- View, edit, add, and delete LocalStorage items
- View, edit, add, and delete SessionStorage items
- View, edit, add, and delete Cookies
- View IndexedDB database structure
- Backup and restore LocalStorage data
- Save and switch Cookie account configurations
- Create and manage website profiles
- Quick search for storage items

## User Guide

### After installing the extension, you can:

1. **View Storage Data**
   - Open the webpage you want to inspect
   - Click the extension icon in the Chrome toolbar
   - LocalStorage data for the current webpage is displayed by default
   - Click the tabs at the top to switch between different storage types

2. **Edit Storage Data**
   - Click the "Edit" button on the right side of any storage item
   - Modify the key name and value in the popup edit window
   - For Cookies, you can also edit domain, path, expiration time, and other attributes
   - Click the "Save" button to apply changes

3. **Add New Storage Items**
   - Click the "Add Item" button in the corresponding tab
   - Enter the key name and value in the popup window
   - Click the "Save" button

4. **Delete Storage Items**
   - Click the "Delete" button on the right side of any storage item
   - Or use the "Clear All" button to delete all items

5. **Backup and Restore LocalStorage**
   - In the LocalStorage tab, click the "Backup" button
   - Enter backup name and description, then click "Confirm"
   - To restore, click the "Restore" button, select the backup to restore, and click "Confirm"

6. **Cookie Account Management**
   - In the Cookies tab, click the "Save Account" button
   - Enter account name and description, then click "Confirm"
   - To switch accounts, click the "Switch Account" button, select the account to switch to, and click "Confirm"

7. **Profile Management**
   - Click the "Save" icon at the top to save the current configuration
   - Enter profile name and select content to include (LocalStorage and/or Cookies)
   - Click the "Save Profile" button
   - Use the dropdown menu at the top to switch between different profiles
   - Click the "Manage" icon to view, load, or delete saved profiles

8. **Search Function**
   - Use the search box in each tab to quickly find the items you need

## Manual Packaging and Chrome Extension Import

If you want to package this extension yourself and install it in Chrome browser, please follow these steps:

### Prepare Files

Make sure you have the following files:
- manifest.json (extension configuration file)
- popup.html (extension popup interface)
- popup.js (extension main functionality script)
- popup.css (extension style file)
- background.js (extension background script)
- content.js (extension content script)
- profiles.js (extension profile management script)
- icons/ (icon folder containing icon16.png, icon48.png, icon128.png)

### Packaging Steps

1. **Download Project Files**
   - Ensure all necessary files are ready and placed in one folder

2. **Open Chrome Extensions Page**
   - Enter `chrome://extensions/` in the Chrome address bar
   - Or select "More Tools" → "Extensions" from the Chrome menu

3. **Enable Developer Mode**
   - Turn on the "Developer mode" switch in the top right corner of the extensions page

4. **Import Extension**
   Method 1: Load unpacked extension directly
   - Click the "Load unpacked" button on the page
   - Select the folder containing all extension files
   - Chrome will immediately load and enable the extension

   Method 2: Package as .crx file
   - Click the "Pack extension" button on the page
   - In the "Extension root directory" field, select the folder containing all extension files
   - Click the "Pack extension" button
   - Chrome will create a .crx file (extension installation package) and a .pem file (private key file)
   - Drag and drop the .crx file to Chrome's extensions page to install

5. **Verify Installation**
   - The extension icon should appear in the Chrome toolbar
   - Click the icon to check if the functionality works properly

### Notes

- Save the private key (.pem) file, which is used for updating the extension
- If you modify the extension code, you need to click the "Reload" button on the extensions page or repackage
- Extensions loaded in developer mode will show a warning every time Chrome starts, which is normal
- Chrome security policies may restrict certain features, such as cross-origin requests

## FAQ

- **Q: Why can't some websites' Cookies be edited?**
  A: For security reasons, certain Cookies (such as those marked as HttpOnly) cannot be directly edited through extensions.

- **Q: Why can IndexedDB data only be viewed but not edited?**
  A: Due to the complex structure of IndexedDB, this extension currently only supports viewing its structure, not editing functionality.

- **Q: Can profiles be synchronized across devices?**
  A: By default, profiles are stored locally. For cross-device use, you can export and manually import them.

- **Q: How to improve the experience when editing large amounts of JSON data?**
  A: Use the "Format JSON" and "Compress JSON" buttons in the popup to more conveniently view and edit JSON data. Additionally, the edit box supports resizing and can be adjusted according to content length.

## Privacy and Security Notice

- This extension does not collect or transmit your data to any external servers
- All operations and data are saved in the browser's local storage
- The extension only runs on websites you authorize

## Version Information

- **Current Version**: 1.1.10
- **Manifest Version**: 3
- **Compatible with**: Chrome browsers supporting Manifest V3

## License

This project is open source. Please refer to the license file for specific license terms.

## Support

If you encounter any issues or have suggestions for improvement, please feel free to contact us or submit an issue report.

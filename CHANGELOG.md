# Changelog

All notable changes to Storage Manager Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.7] - 2025-01-01

### 🐛 Fixed

#### **Duplicate Name Validation**
- **Account Names** - Added duplicate name checking when saving Cookie accounts with automatic unique name suggestions
- **Profile Names** - Added duplicate name checking when saving Storage backup profiles with automatic unique name suggestions
- **Smart Suggestions** - Automatically generates unique names like "Account Name (2)" when duplicates are detected
- **User Choice** - Users can choose to use suggested names or keep current names and modify manually

#### **Confirmation Dialog Variable Replacement**
- **Cookie Deletion** - Fixed variable replacement in Cookie deletion confirmation dialogs to show actual Cookie names
- **Storage Item Deletion** - Fixed variable replacement in localStorage/sessionStorage item deletion confirmations
- **Account Deletion** - Fixed variable replacement in account deletion confirmation dialogs
- **Profile Deletion** - Fixed variable replacement in profile deletion confirmation dialogs
- **Proper Interpolation** - All confirmation dialogs now correctly display item names using i18next interpolation

#### **Extension Context Invalidated Error on Claude.ai**
- **Root Cause Resolution** - Fixed "Extension context invalidated" errors specifically occurring on claude.ai and similar AI websites
- **Enhanced Context Validation** - Added deep extension context checking with actual communication capability testing
- **Smart Retry Mechanism** - Improved retry logic with detailed error logging and debugging information
- **Debounce Protection** - Added 100ms debounce mechanism to prevent frequent message sending that could cause context invalidation
- **Page Lifecycle Monitoring** - Implemented automatic recovery through page visibility, focus, and error event listeners
- **Special Site Handling** - Added specific handling for claude.ai, ChatGPT, and other AI platforms that use dynamic content management

### 🔧 Technical Improvements

#### **Extension Communication System**
- **New Method**: `isExtensionContextReallyValid()` - Deep context validation through PING message testing
- **Enhanced Method**: `sendMessageWithRetry()` - Intelligent retry with pre-retry context validation
- **Special Site Detection**: Automatic identification of problematic websites for enhanced error handling
- **Auto-Recovery Mechanism**: Automatic extension context recovery when page state changes
- **PING Message Handler**: Added background script support for extension communication testing

#### **Debugging & Monitoring**
- **Comprehensive Debug Guide** - Created detailed troubleshooting documentation for claude.ai issues
- **Enhanced Error Logging** - Added detailed context information including URL, domain, and error specifics
- **Page Event Monitoring** - Listening for visibilitychange, focus, beforeunload, and error events
- **Recovery Logging** - Detailed logging of recovery attempts and success/failure status

## [2.1.2] - 2025-07-01

### ✨ Enhanced

#### 🔧 **Code Quality & Development Experience**
- **ESLint Configuration Upgrade** - Implemented comprehensive ESLint rules with React, TypeScript, and modern JavaScript standards
- **Automated Code Formatting** - Added consistent code style enforcement with automatic fixing capabilities
- **Type Safety Improvements** - Enhanced TypeScript configuration with stricter type checking
- **Build Process Optimization** - Improved development workflow with better linting integration

#### 🎨 **UI/UX Improvements**
- **Unified Scrollbar Design** - Implemented consistent scrollbar styling across all components
- **Dark Mode Scrollbar Enhancement** - Optimized scrollbar appearance in dark theme with modern gradients and rounded corners
- **Responsive Scrollbar Behavior** - Added adaptive scrollbar sizing for different component contexts
- **Cross-browser Compatibility** - Ensured scrollbar styling works consistently across WebKit and Firefox browsers

#### 📋 **Documentation & Release Process**
- **Automated Release Workflow** - Created comprehensive one-click release script with version synchronization
- **Documentation Synchronization** - Ensured all documentation files maintain consistent versioning and content
- **Multi-language Support** - Updated both English and Chinese documentation with latest features
- **Release Automation** - Streamlined build, package, commit, and deployment processes

### 🛠️ **Technical Improvements**
- **ESLint Rules** - Added 50+ code quality rules covering React hooks, TypeScript best practices, and code formatting
- **SCSS Modularity** - Enhanced stylesheet organization with dedicated scrollbar component styles
- **Build Scripts** - Improved package.json scripts for better development and release workflows
- **Error Handling** - Fixed remaining ESLint errors and warnings for cleaner codebase

### 📚 **Documentation Updates**
- **Version Consistency** - Synchronized version numbers across all configuration files
- **Feature Documentation** - Updated tutorials and guides to reflect latest improvements
- **Release Notes** - Enhanced changelog format with detailed categorization and technical details

## [2.1.1] - 2025-06-30

### 🐛 Fixed

#### 🔧 **Extension Context Stability**
- **Extension Context Invalidated Error Fix** - Resolved "Extension context invalidated" error that occurred during extension reload or update
- **Smart Retry Mechanism** - Added intelligent retry logic with exponential backoff (1s, 2s, 3s delays)
- **Context Validation** - Implemented extension context validity checks before Chrome API calls
- **Error Type Recognition** - Enhanced error handling to identify and handle various context invalidation scenarios
- **Communication Stability** - Improved reliability of content script ↔ background script communication
- **Graceful Degradation** - Added fallback mechanisms when extension context becomes unavailable

#### 🛠️ **Technical Improvements**
- **ExtensionContextUtils Class** - Created centralized utility class for context management
- **Enhanced Error Handling** - Added comprehensive error categorization and user-friendly messages
- **Logging Improvements** - Enhanced debugging information for context-related issues
- **Code Consolidation** - Unified retry logic across all Chrome API interactions

### 📚 Documentation
- **Extension Context Fix Guide** - Added comprehensive documentation (`docs/EXTENSION_CONTEXT_FIX.md`)
- **Error Troubleshooting** - Detailed explanation of causes, solutions, and prevention measures
- **Developer Guidelines** - Best practices for handling extension context in Chrome extensions

## [2.1.0] - 2025-06-29

### ✨ Added

#### 🔧 **Enhanced Encoding/Decoding Tools**
- **Restored Base64/UTF-8 Encoding** - Re-added Base64 and UTF-8 encoding/decoding buttons alongside JSON formatting tools
- **Independent Encoding Tool Modal** - Created dedicated encoding/decoding workspace with tabbed interface
- **Fullscreen Editor Enhancement** - Added encoding/decoding capabilities to fullscreen editing mode
- **Smart Tool Integration** - Seamlessly integrated encoding tools into all storage panels

#### 🎯 **Smart Domain Management**
- **Intelligent Current Domain Detection** - Automatically selects current active tab's domain as default
- **Smart Cookie Domain Setting** - Auto-configures Cookie domain field with top-level domain (e.g., www.yy.com → .yy.com)
- **IP Address Support** - Maintains original IP addresses for Cookie domain settings
- **Enhanced Domain Logic** - Improved domain extraction and validation for both popup and tab modes

#### 🎨 **UI/UX Improvements**
- **Modal Centering Fix** - Ensured all modals display correctly centered in popup mode
- **Fullscreen Editor Optimization** - Enhanced fullscreen editing with better layout and tool accessibility
- **Responsive Format Buttons** - Improved button layout with flex-wrap for better mobile experience
- **Enhanced Encoding Interface** - Added intuitive tabbed interface for Base64 and UTF-8 operations

### 🔄 Changed

#### 🛠️ **Tool Integration**
- **Unified Encoding Access** - Added encoding tool buttons to LocalStorage and SessionStorage panels
- **Enhanced Format Toolbar** - Expanded formatting options in both normal and fullscreen modes
- **Improved Tool Discoverability** - Made encoding/decoding tools more accessible across the interface

#### 🎯 **Domain Handling**
- **Prioritized Domain Selection** - Current active tab domain now takes precedence in domain dropdown
- **Intelligent Cookie Defaults** - Cookie creation now uses smart domain extraction for better compatibility

### 🐛 Fixed

#### 🔧 **Technical Issues**
- **Modal Positioning** - Fixed modal centering issues in popup mode
- **Domain Detection** - Resolved current domain detection in new tab and popup modes
- **Cookie Domain Logic** - Fixed Cookie domain field to use appropriate top-level domain format

#### 🎨 **UI Fixes**
- **Fullscreen Layout** - Improved fullscreen editor to properly utilize available space
- **Button Responsiveness** - Enhanced format button layout for better mobile and small screen support
- **Theme Consistency** - Ensured encoding tool modal follows dark/light theme properly

### 🌐 **Internationalization**

#### 📝 **New Translations**
- Added Chinese translations for encoding tool interface
- Added English translations for new encoding features
- Enhanced translation coverage for all new UI elements

### 📊 **Performance & Quality**

#### 🚀 **Optimizations**
- **Efficient Tool Loading** - Optimized encoding tool modal for faster rendering
- **Smart Component Updates** - Improved React component efficiency for encoding operations
- **Memory Management** - Enhanced cleanup for encoding/decoding operations

## [2.0.0] - 2025-06-20

### 🎉 Major Release - Complete Architecture Rewrite

This is a major release that completely rewrites Storage Manager Pro using modern web technologies.

### ✨ Added

#### 🔧 **New Technology Stack**
- **React 18+** - Modern component-based architecture with Hooks
- **TypeScript 5+** - Complete type safety and better development experience
- **Vite 5+** - Lightning-fast build tool with hot module replacement
- **SCSS Modules** - Modular and maintainable styling system
- **Zustand** - Lightweight state management solution

#### 🏗️ **Architecture Improvements**
- **Service Layer** - Modular Chrome API wrappers for better maintainability
- **Component Library** - Reusable React components with consistent design
- **Hook System** - Custom React hooks for state and side effect management
- **Type Definitions** - Comprehensive TypeScript interfaces and types
- **Error Boundaries** - Robust error handling and recovery mechanisms

#### 🧪 **Testing & Quality Assurance**
- **Functional Verification** - Comprehensive integration testing suite
- **E2E Testing** - End-to-end testing for storage operations
- **Performance Analysis** - Build size and runtime performance monitoring
- **Compatibility Testing** - Chrome extension API compatibility validation
- **Build Analysis** - Detailed bundle analysis and optimization recommendations

#### 🛠️ **Development Tools**
- **Hot Reload** - Instant development feedback with Vite
- **Type Checking** - Real-time TypeScript validation
- **Build Optimization** - Automated code splitting and minification
- **Performance Monitoring** - Runtime performance metrics and analysis

### 🔄 Changed

#### 📦 **Build System**
- Migrated from native JavaScript to React + TypeScript + Vite
- Implemented modular SCSS architecture with CSS modules
- Added automated build optimization and code splitting
- Improved development workflow with hot module replacement

#### 🎨 **User Interface**
- Redesigned with modern React components
- Enhanced responsive design and accessibility
- Improved theme system with better color schemes
- Optimized component rendering performance

#### 🔧 **Code Organization**
- Restructured project with clear separation of concerns
- Implemented service-oriented architecture
- Added comprehensive type definitions
- Improved error handling and user feedback

### 🐛 Fixed

#### 🔧 **Technical Issues**
- Fixed SCSS deprecation warnings by migrating to @use syntax
- Resolved TypeScript compilation errors and type inconsistencies
- Improved Chrome extension API compatibility
- Enhanced error handling for edge cases

#### 🎯 **Performance Optimizations**
- Reduced bundle size through code splitting and tree shaking
- Optimized component rendering with React.memo and hooks
- Improved memory management and cleanup
- Enhanced loading performance with lazy loading

### 📊 **Performance Metrics**

- **Bundle Size**: ~360KB (optimized)
- **Load Time**: <500ms
- **Memory Usage**: <10MB
- **Compatibility Score**: 95%+
- **Build Time**: <30s

### 🔧 **Technical Details**

#### **Project Structure**
```
src/
├── components/          # React components
├── services/           # Chrome API services
├── hooks/              # Custom React hooks
├── styles/             # SCSS modules
├── types/              # TypeScript definitions
├── locales/            # i18n resources
├── background/         # Service worker
├── content/            # Content scripts
└── tab/                # Main interface
```

#### **Build Commands**
```bash
npm install             # Install dependencies
npm run dev            # Development mode
npm run build          # Production build
npm run type-check     # TypeScript validation
node scripts/analyze-build.js  # Bundle analysis
```

### 🚀 **Migration Guide**

For users upgrading from v1.x:

1. **Installation**: No changes required - the extension will update automatically
2. **Features**: All existing features are preserved and enhanced
3. **Data**: All stored configurations and data remain compatible
4. **Settings**: Theme and language preferences are maintained

### 🔮 **Future Roadmap**

- **v2.1.0**: Enhanced IndexedDB management capabilities
- **v2.2.0**: Advanced data export/import features
- **v2.3.0**: Plugin system for custom data processors
- **v3.0.0**: Web-based companion app

---

## [1.1.10] - 2025-6-2

### Added
- Dual language support (Chinese/English)
- Enhanced UI with modern design
- Configuration file management system

### Fixed
- Edit button layout issues
- Storage data synchronization problems
- Theme switching inconsistencies

### Changed
- Improved user interface design
- Better error handling and user feedback
- Enhanced performance and stability

---

## [1.1.0] - 2025-5-15

### Added
- JSON formatting and compression tools
- Base64 encoding/decoding functionality
- Pin functionality for persistent windows
- Domain selection from active tabs
- Backup and restore capabilities

### Fixed
- Content script injection issues
- Cross-origin access problems
- UI responsiveness on different screen sizes

---

## [1.0.0] - 2025-5-4

### Added
- Initial release of Storage Manager Pro
- LocalStorage management
- SessionStorage editing
- Cookie management
- IndexedDB viewing
- Basic theme support
- Multi-domain support

---

## Legend

- 🎉 Major Release
- ✨ Added - New features
- 🔄 Changed - Changes in existing functionality
- 🐛 Fixed - Bug fixes
- 🔧 Technical - Technical improvements
- 📦 Build - Build system changes
- 🎨 UI - User interface improvements
- 🚀 Performance - Performance improvements
- 📊 Metrics - Performance and analytics data

#!/usr/bin/env node

/**
 * Storage Manager Pro - 构建分析脚本
 * 分析构建输出的文件大小和组成
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BuildAnalyzer {
  constructor(distPath = './dist') {
    this.distPath = distPath;
    this.results = {
      totalSize: 0,
      files: [],
      breakdown: {},
      recommendations: [],
    };
  }

  /**
   * 获取文件大小（字节）
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.warn(`无法获取文件大小: ${filePath}`);
      return 0;
    }
  }

  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 递归分析目录
   */
  analyzeDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        this.analyzeDirectory(fullPath, relativeItemPath);
      } else {
        const size = stats.size;
        this.results.totalSize += size;
        
        const fileInfo = {
          path: relativeItemPath,
          size: size,
          formattedSize: this.formatSize(size),
          type: this.getFileType(item),
        };
        
        this.results.files.push(fileInfo);
        
        // 按类型分类
        if (!this.results.breakdown[fileInfo.type]) {
          this.results.breakdown[fileInfo.type] = {
            count: 0,
            totalSize: 0,
            files: [],
          };
        }
        
        this.results.breakdown[fileInfo.type].count++;
        this.results.breakdown[fileInfo.type].totalSize += size;
        this.results.breakdown[fileInfo.type].files.push(fileInfo);
      }
    });
  }

  /**
   * 获取文件类型
   */
  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
      case '.js':
        return 'JavaScript';
      case '.css':
        return 'CSS';
      case '.html':
        return 'HTML';
      case '.json':
        return 'JSON';
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.svg':
        return 'Images';
      default:
        return 'Other';
    }
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const jsFiles = this.results.breakdown['JavaScript'];
    const cssFiles = this.results.breakdown['CSS'];
    const totalSizeMB = this.results.totalSize / (1024 * 1024);

    // JavaScript文件分析
    if (jsFiles) {
      const largestJS = jsFiles.files.sort((a, b) => b.size - a.size)[0];
      if (largestJS && largestJS.size > 300 * 1024) { // 300KB
        this.results.recommendations.push({
          type: 'warning',
          category: 'JavaScript',
          message: `${largestJS.path} 文件过大 (${largestJS.formattedSize})`,
          suggestions: [
            '考虑使用代码分割 (Code Splitting)',
            '移除未使用的依赖',
            '使用 Tree Shaking 优化',
            '考虑懒加载非关键组件',
          ],
        });
      }

      if (jsFiles.totalSize > 500 * 1024) { // 500KB
        this.results.recommendations.push({
          type: 'warning',
          category: 'JavaScript',
          message: `JavaScript 总体积过大 (${this.formatSize(jsFiles.totalSize)})`,
          suggestions: [
            '分析依赖包大小，移除不必要的库',
            '使用更轻量的替代方案',
            '启用生产环境优化',
          ],
        });
      }
    }

    // CSS文件分析
    if (cssFiles) {
      if (cssFiles.totalSize > 100 * 1024) { // 100KB
        this.results.recommendations.push({
          type: 'info',
          category: 'CSS',
          message: `CSS 文件较大 (${this.formatSize(cssFiles.totalSize)})`,
          suggestions: [
            '移除未使用的CSS规则',
            '使用CSS压缩',
            '考虑CSS模块化',
          ],
        });
      }
    }

    // 总体积分析
    if (totalSizeMB > 1) { // 1MB
      this.results.recommendations.push({
        type: 'error',
        category: 'Overall',
        message: `扩展总体积过大 (${this.formatSize(this.results.totalSize)})`,
        suggestions: [
          '全面优化所有资源',
          '考虑按需加载',
          '压缩所有静态资源',
        ],
      });
    } else if (totalSizeMB > 0.5) { // 500KB
      this.results.recommendations.push({
        type: 'warning',
        category: 'Overall',
        message: `扩展体积较大 (${this.formatSize(this.results.totalSize)})`,
        suggestions: [
          '继续优化以减小体积',
          '监控体积增长',
        ],
      });
    } else {
      this.results.recommendations.push({
        type: 'success',
        category: 'Overall',
        message: `扩展体积控制良好 (${this.formatSize(this.results.totalSize)})`,
        suggestions: ['继续保持'],
      });
    }
  }

  /**
   * 运行分析
   */
  analyze() {
    console.log('🔍 开始构建分析...\n');

    if (!fs.existsSync(this.distPath)) {
      console.error(`❌ 构建目录不存在: ${this.distPath}`);
      console.log('请先运行 npm run build');
      return null;
    }

    this.analyzeDirectory(this.distPath);
    this.generateRecommendations();

    return this.results;
  }

  /**
   * 生成报告
   */
  generateReport() {
    const results = this.analyze();
    if (!results) return;

    console.log('📊 构建分析报告');
    console.log('='.repeat(60));
    console.log(`总体积: ${this.formatSize(results.totalSize)}`);
    console.log(`文件数量: ${results.files.length}`);
    console.log('='.repeat(60));

    // 按类型分组显示
    console.log('\n📁 文件类型分布:');
    Object.entries(results.breakdown).forEach(([type, info]) => {
      const percentage = ((info.totalSize / results.totalSize) * 100).toFixed(1);
      console.log(`  ${type}: ${info.count} 个文件, ${this.formatSize(info.totalSize)} (${percentage}%)`);
    });

    // 显示最大的文件
    console.log('\n📄 最大的文件:');
    const sortedFiles = results.files.sort((a, b) => b.size - a.size).slice(0, 10);
    sortedFiles.forEach((file, index) => {
      const percentage = ((file.size / results.totalSize) * 100).toFixed(1);
      console.log(`  ${index + 1}. ${file.path}: ${file.formattedSize} (${percentage}%)`);
    });

    // 显示建议
    console.log('\n💡 优化建议:');
    results.recommendations.forEach(rec => {
      const icon = rec.type === 'error' ? '❌' : rec.type === 'warning' ? '⚠️' : rec.type === 'success' ? '✅' : 'ℹ️';
      console.log(`\n${icon} ${rec.category}: ${rec.message}`);
      rec.suggestions.forEach(suggestion => {
        console.log(`     - ${suggestion}`);
      });
    });

    console.log('\n✅ 构建分析完成！');
  }

  /**
   * 导出JSON报告
   */
  exportJSON(outputPath = './build-analysis.json') {
    const results = this.analyze();
    if (!results) return;

    // 读取package.json
    const packageJsonPath = path.join(__dirname, '../package.json');
    let version = '2.0.0';
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      version = packageJson.version;
    } catch (error) {
      console.warn('无法读取package.json版本信息');
    }

    const report = {
      timestamp: new Date().toISOString(),
      version,
      ...results,
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 报告已导出到: ${outputPath}`);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new BuildAnalyzer();

  const args = process.argv.slice(2);
  if (args.includes('--json')) {
    analyzer.exportJSON();
  } else {
    analyzer.generateReport();
  }
}

export default BuildAnalyzer;

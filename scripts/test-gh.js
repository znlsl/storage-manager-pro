#!/usr/bin/env node

/**
 * 测试 GitHub CLI 是否正常工作
 */

import { execSync } from 'child_process';

function testGitHubCLI() {
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
    
    console.log('🔍 Testing GitHub CLI...');
    
    // 测试 gh 命令是否存在
    const version = execSync('gh --version', { 
      encoding: 'utf8',
      env: extendedEnv
    });
    
    console.log('✅ GitHub CLI found:');
    console.log(version);
    
    // 测试认证状态
    try {
      const authStatus = execSync('gh auth status', { 
        encoding: 'utf8',
        env: extendedEnv,
        stdio: 'pipe'
      });
      console.log('✅ GitHub CLI authenticated:');
      console.log(authStatus);
    } catch (authErr) {
      console.log('⚠️  GitHub CLI not authenticated:');
      console.log('Run: gh auth login');
    }
    
    // 测试仓库状态
    try {
      const repoStatus = execSync('gh repo view --json name,owner', { 
        encoding: 'utf8',
        env: extendedEnv,
        stdio: 'pipe'
      });
      console.log('✅ Repository detected:');
      console.log(JSON.parse(repoStatus));
    } catch (repoErr) {
      console.log('⚠️  No repository detected or not set as default:');
      console.log('Run: gh repo set-default');
    }
    
  } catch (err) {
    console.log('❌ GitHub CLI not found or not working:');
    console.log(err.message);
    console.log('\n💡 To install GitHub CLI:');
    console.log('macOS: brew install gh');
    console.log('Or run: ./scripts/setup-github-cli.sh');
  }
}

testGitHubCLI();

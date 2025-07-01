#!/bin/bash

# Storage Manager Pro - GitHub CLI 安装脚本
# 用于自动安装 GitHub CLI 以支持自动发布功能

echo "🔧 Setting up GitHub CLI for automated releases..."

# 检查操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 Detected macOS"
    
    # 检查是否安装了 Homebrew
    if command -v brew &> /dev/null; then
        echo "🍺 Installing GitHub CLI via Homebrew..."
        brew install gh
    else
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux"
    
    # Ubuntu/Debian
    if command -v apt &> /dev/null; then
        echo "📦 Installing GitHub CLI via apt..."
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install gh
    
    # CentOS/RHEL/Fedora
    elif command -v yum &> /dev/null || command -v dnf &> /dev/null; then
        echo "📦 Installing GitHub CLI via yum/dnf..."
        sudo dnf install 'dnf-command(config-manager)'
        sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
        sudo dnf install gh
    
    else
        echo "❌ Unsupported Linux distribution. Please install GitHub CLI manually:"
        echo "   https://github.com/cli/cli#installation"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    echo "🪟 Detected Windows"
    echo "Please install GitHub CLI manually:"
    echo "1. Download from: https://github.com/cli/cli/releases"
    echo "2. Or use winget: winget install --id GitHub.cli"
    echo "3. Or use Chocolatey: choco install gh"
    exit 1
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "Please install GitHub CLI manually: https://github.com/cli/cli#installation"
    exit 1
fi

# 验证安装
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI installed successfully!"
    echo "📋 Version: $(gh --version)"
    echo ""
    echo "🔐 Next steps:"
    echo "1. Authenticate with GitHub: gh auth login"
    echo "2. Set up your repository: gh repo set-default"
    echo "3. Test the release script: npm run release:dry"
    echo ""
    echo "💡 For more information, run: gh --help"
else
    echo "❌ GitHub CLI installation failed"
    exit 1
fi

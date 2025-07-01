import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' // 使用现代编译器 API
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        tab: resolve(__dirname, 'src/tab/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        init: resolve(__dirname, 'src/tab/init.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'init') return 'init.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0] === 'tab.html') return 'tab.html';
          return 'assets/[name].[hash].[ext]';
        }
      }
    },
    cssCodeSplit: false,
    sourcemap: process.env.NODE_ENV === 'development'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@locales': resolve(__dirname, 'src/locales')
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5174
    }
  }
})

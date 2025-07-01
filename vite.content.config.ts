import { defineConfig } from 'vite'
import { resolve } from 'path'

// 专门用于构建content script的配置
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // 不清空输出目录，因为主构建已经生成了其他文件
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'ContentScript',
      fileName: 'content',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'content.js',
        // 确保所有依赖都被内联到单个文件中
        inlineDynamicImports: true
      },
      // 不将任何依赖标记为external，全部打包进去
      external: []
    },
    // 禁用代码分割，确保生成单个文件
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
  }
})

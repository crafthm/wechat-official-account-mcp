import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths({
      // 忽略 3rd/md 目录下的 tsconfig.json，避免解析错误
      ignoreConfigErrors: true,
      // 只解析项目根目录的 tsconfig.json
      root: './',
    }),
  ],
  resolve: {
    alias: {
      // 排除 Node.js 专用模块，避免在浏览器中打包
      'minio': 'data:text/javascript,export default {}',
      'ali-oss': 'data:text/javascript,export default {}',
      'buffer-from': 'data:text/javascript,export default {}',
      // 排除 3rd/md 中的 Vue 相关导入
      'vue': 'data:text/javascript,export default {}',
      'wxt/browser': 'data:text/javascript,export default {}',
    },
  },
  optimizeDeps: {
    exclude: ['minio', 'ali-oss', 'buffer-from', 'vue', 'wxt/browser'],
  },
  build: {
    rollupOptions: {
      external: ['minio', 'ali-oss', 'buffer-from'],
    },
  },
  define: {
    'process.env': '{}',
    'global': 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq) => {
            console.log('Proxying request to:', _proxyReq.path);
          });
          proxy.on('proxyRes', (_proxyRes, _req) => {
            console.log('Received response from:', _req.url);
          });
          proxy.on('error', (_err) => {
            console.error('Proxy error:', _err);
          });
        },
      }
    }
  }
})

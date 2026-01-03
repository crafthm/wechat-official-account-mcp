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
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      // 排除 Node.js 专用模块，避免在浏览器中打包
      'minio': 'data:text/javascript,export default {}',
      'ali-oss': 'data:text/javascript,export default {}',
      'buffer-from': 'data:text/javascript,export default {}',
    },
  },
  optimizeDeps: {
    exclude: ['minio', 'ali-oss', 'buffer-from'],
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

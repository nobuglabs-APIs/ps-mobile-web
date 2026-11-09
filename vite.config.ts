import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['brand/ps-mobile.webp', 'brand/nobuglabs-logo.webp'],
      manifest: {
        id: '/',
        name: 'PS-Mobile | Gestão e Vendas',
        short_name: 'PS-Mobile',
        description: 'Gestão simples e rápida de vendas, produtos e faturação.',
        lang: 'pt-AO',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f5f7fb',
        theme_color: '#f5f7fb',
        icons: [
          {
            src: '/brand/ps-mobile.webp',
            sizes: '300x300',
            type: 'image/webp',
            purpose: 'any',
          },
        ],
        shortcuts: [
          {
            name: 'Nova venda',
            short_name: 'Vendas',
            url: '/?view=sales',
            icons: [{ src: '/brand/ps-mobile.webp', sizes: '300x300', type: 'image/webp' }],
          },
          {
            name: 'Produtos',
            short_name: 'Produtos',
            url: '/?view=products',
            icons: [{ src: '/brand/ps-mobile.webp', sizes: '300x300', type: 'image/webp' }],
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
});

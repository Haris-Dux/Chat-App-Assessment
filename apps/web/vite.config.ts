import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  server: {
    proxy: {
      '/api': apiOrigin,
      '/socket.io': { target: apiOrigin, ws: true },
    },
  },
});

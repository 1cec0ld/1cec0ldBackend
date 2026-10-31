import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  // The server build's entry is server/app.ts (Express app wrapping React Router),
  // which server.js mounts in production.
  environments: {
    ssr: {
      build: {
        rollupOptions: { input: './server/app.ts' },
      },
    },
  },
  plugins: [reactRouter()],
  resolve: { tsconfigPaths: true },
});

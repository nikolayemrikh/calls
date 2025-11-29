import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';

import tsconfig from './tsconfig.json';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  plugins: [
    react(),
    checker({
      typescript: {
        tsconfigPath: 'tsconfig.json',
      },
      overlay: { initialIsOpen: false },
    }),
    svgr(),
  ],
  resolve: {
    alias: Object.entries(tsconfig.compilerOptions.paths).reduce<Record<string, string>>((acc, [alias, paths]) => {
      /** Find all "/*"" */
      const re = /\/\*/g;
      const name = alias.replace(re, '');
      const location = resolve(paths[0].replace(re, ''));
      acc[name] = location;
      return acc;
    }, {}),
  },
  server: {
    host: '0.0.0.0',
    // proxy: {
    //   '/test': {
    //     target: 'http://192.168.1.6:54321',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/test/, ''),
    //   },
    // },
  },
});

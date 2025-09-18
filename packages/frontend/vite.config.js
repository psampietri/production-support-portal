import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Explicitly set the root of the frontend application to the current directory
  root: '.', 
  build: {
    // Explicitly set the entry point for the build process
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
  server: {
    // Set the port for the development server
    port: 3000,
  }
});
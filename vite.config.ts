import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {defineConfig} from 'vite';

// Force-load the local .env file if it exists to override any shadowed environment placeholder values
const localEnv: Record<string, string> = {};
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const key in envConfig) {
      localEnv[key] = envConfig[key];
    }
  }
} catch (e) {
  console.log("Failed to load .env file manually:", e);
}

// Access-proof default values from .env
const supabaseUrl = localEnv.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://mranisjoydkfmsowuzms.supabase.co';
const supabaseAnonKey = localEnv.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yYW5pc2pveWRrZm1zb3d1em1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTU4ODYsImV4cCI6MjA5NDk5MTg4Nn0.ZOY6FH2JMd6vz5w76QanqQxuWIL0VcLNKLvU2xuinZQ';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

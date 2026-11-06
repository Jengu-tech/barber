import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environmental parameters
dotenv.config();

const cleanEnvVar = (val: string): string => {
  if (!val) return '';
  let cleaned = val.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve API config endpoint
  app.get('/api/config', (req, res) => {
    // Read secure variables from backend env safely
    const rawUrl = process.env.VITE_SUPABASE_URL || '';
    const rawKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEy || '';
    
    const cleanUrl = cleanEnvVar(rawUrl);
    const cleanKey = cleanEnvVar(rawKey);

    // Validate Supabase credentials: must be real https URL and valid JWT key
    const isPlaceholderUrl = 
      !cleanUrl ||
      cleanUrl.includes('PLACEHOLDER') || 
      cleanUrl.includes('mranisjoydkfmsowuzms') || 
      cleanUrl.includes('xljsfsejmkokxhkcuyns');

    const isPlaceholderKey = 
      !cleanKey ||
      cleanKey.includes('PLACEHOLDER') || 
      cleanKey === 'VITE_SUPABASE_ANON_KEy' || 
      cleanKey === 'VITE_SUPABASE_ANON_KEY' || 
      !cleanKey.startsWith('eyJ');

    if (isPlaceholderUrl || isPlaceholderKey) {
      // Return empty so the app operates in robust local/offline mode
      res.json({
        supabaseUrl: '',
        supabaseAnonKey: ''
      });
      return;
    }

    res.json({
      supabaseUrl: cleanUrl,
      supabaseAnonKey: cleanKey
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Dev Server] Mounting active Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Prod Server] Serving built files statically...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Host Server] Express server online: http://0.0.0.0:${PORT}`);
  });
}

startServer();

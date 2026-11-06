import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function initApp() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    (window as any).__SUPABASE_CONFIG__ = {
      supabaseUrl: data.supabaseUrl,
      supabaseAnonKey: data.supabaseAnonKey,
    };
  } catch (err) {
    console.warn("Failed to retrieve dynamic configuration from API, falling back to client defaults:", err);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

initApp();

// Register service worker for PWA support in production environments
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('BarberQ ServiceWorker registered successfully.', reg.scope);
      })
      .catch((err) => {
        console.warn('BarberQ ServiceWorker registration failed:', err);
      });
  });
}

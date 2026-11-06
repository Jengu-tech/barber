/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BarberProvider, useBarber } from './context/BarberContext';
import ClientView from './components/ClientView';
import BarberDashboard from './components/BarberDashboard';
import AccountingView from './components/AccountingView';
import HelpGuide from './components/HelpGuide';
import { BarberLogin, BarberRegister, BarberSetup } from './components/BarberAuth';
import { supabase } from './lib/supabase';
import { getPendingCount, flushOutbox } from './lib/outbox';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Scissors, User, DollarSign, Wifi, Battery, Smartphone, Clock, Sparkles, Sun, Moon, Cloud, CloudOff, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { currentRole, setCurrentRole, queue, shopName } = useBarber();
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const isBarberSide = currentPath === '/barber/dashboard' || currentPath === '/barber/accounting';
  const [currentTime, setCurrentTime] = useState<string>('12:00');
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [isLight, setIsLight] = useState<boolean>(() => {
    return localStorage.getItem('barberpro_theme') === 'light';
  });
  const [pendingOps, setPendingOps] = useState<number>(0);
  const { canInstall, isIOS, installApp } = usePWAInstall();

  const handleInstallClick = () => {
    if (isIOS) {
      window.alert(
        "Pour installer l'application sur iOS :\n\n1. Appuyez sur le bouton Partager.\n2. Sélectionnez « Sur l'écran d'accueil ».\n3. Appuyez sur « Ajouter »."
      );
      return;
    }

    void installApp();
  };

  // Sync light/dark theme with document body/root element
  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light');
      localStorage.setItem('barberpro_theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('barberpro_theme', 'dark');
    }
  }, [isLight]);

  useEffect(() => {
    setPendingOps(getPendingCount());
    flushOutbox().then(() => setPendingOps(getPendingCount()));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      flushOutbox().then(() => setPendingOps(getPendingCount()));
    };
    const handleOutboxChange = () => {
      setPendingOps(getPendingCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('barberq_outbox_change', handleOutboxChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('barberq_outbox_change', handleOutboxChange);
    };
  }, []);

  // Sync Supabase Auth & Local session dynamically
  useEffect(() => {
    let isMounted = true;

    // Get current logged in user safely
    supabase.auth.getUser()
      .then((res: any) => {
        if (isMounted) {
          setUser(res?.data?.user ?? null);
          setUserLoading(false);
        }
      })
      .catch((err: any) => {
        console.warn("Session check fallback:", err);
        if (isMounted) {
          setUser(null);
          setUserLoading(false);
        }
      });

    // Listen to real-time auth status updates
    const { data } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setUserLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (data?.subscription?.unsubscribe) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  // Monitor location back/forward popstate trigger
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Main custom navigation utility
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Keep Role Tab synchronized with pathname state
  useEffect(() => {
    if (currentPath === '/barber/dashboard') {
      setCurrentRole('barber');
    } else if (currentPath === '/barber/accounting') {
      setCurrentRole('admin');
    } else if (currentPath === '/' || currentPath.startsWith('/shop/') || currentPath.startsWith('/ticket/')) {
      setCurrentRole('client');
    }
  }, [currentPath, setCurrentRole]);

  // Protected Routes verification
  const securePaths = ['/barber/dashboard', '/barber/setup', '/barber/accounting'];
  const isSecurePath = securePaths.includes(currentPath);

  useEffect(() => {
    if (isSecurePath && !user && !userLoading) {
      navigate('/barber/login');
    }
  }, [currentPath, user, userLoading, isSecurePath]);

  // Dynamic ticking clock for top mobile status bar
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hh}:${mm}`);
    };
    updateTime();
    const id = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const totalWaiting = queue.filter(
    (q) => q.status === 'waiting' || q.status === 'active'
  ).length;

  // Render Full Screen auth & onboarding screens (centrées sur fond #f5f5f3)
  if (currentPath === '/barber/login') {
    return <BarberLogin navigate={navigate} onAuthSuccess={() => {}} />;
  }

  if (currentPath === '/barber/register') {
    return <BarberRegister navigate={navigate} />;
  }

  if (currentPath === '/barber/setup') {
    if (userLoading) {
      return (
        <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin"></div>
        </div>
      );
    }
    return <BarberSetup navigate={navigate} />;
  }

  if (userLoading && isSecurePath) {
    return (
      <div className="min-h-screen bg-[#0a0a09] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg-outer flex flex-col items-center justify-start p-0 overflow-x-hidden select-none transition-colors duration-200">
      
      {/* Top Application Header */}
      <header className="w-full bg-theme-bg-header border-b border-theme-border-header px-4 sm:px-6 py-3 flex justify-between items-center sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-black text-amber-500 font-mono text-sm shadow-sm">
            B
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-neutral-100 tracking-wider font-mono transition-colors leading-none">
              BARBER<span className="text-amber-500">_PRO</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
              Queue & comptabilité
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <div
            role="status"
            title={pendingOps > 0 ? `${pendingOps} opération(s) en attente de synchronisation` : 'Toutes les opérations sont synchronisées'}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border font-mono shadow-sm transition-colors ${
              pendingOps > 0
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'bg-neutral-900/60 text-green-500 border-neutral-800'
            }`}
          >
            {pendingOps > 0 ? (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="whitespace-nowrap">{pendingOps} en attente</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-green-500" />
                <span className="hidden sm:inline">Synchronisé</span>
              </>
            )}
          </div>

          {canInstall && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer font-mono shadow-sm"
              aria-label="Installer l'application"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Installer l'application</span>
              <span className="sm:hidden">Installer</span>
            </button>
          )}

          {/* Mode Switch Button */}
          <button
            onClick={() => setIsLight(prev => !prev)}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer font-mono shadow-sm"
            aria-label="Changer de thème"
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-[spin_8s_linear_infinite]" />
                <span className="hidden sm:inline">CLAIR</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">SOMBRE</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Role Navigation Tabs Router */}
      {!(currentPath.startsWith('/shop/') || currentPath.startsWith('/ticket/')) && (
        <nav className="w-full bg-theme-bg-header/80 backdrop-blur-md border-b border-theme-border-header sticky top-[57px] z-20 transition-colors">
          <div className="max-w-4xl mx-auto px-4 py-2 flex gap-2 justify-center">
            <button
              onClick={() => navigate('/')}
              className={`flex-1 max-w-[200px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all relative ${
                currentPath === '/'
                  ? 'bg-theme-bg-tab-selected text-neutral-100 border border-neutral-700/50 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-bold font-mono">Boutique</span>
              {totalWaiting > 0 && currentPath !== '/' && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-green-500 text-[9px] font-bold text-neutral-950 flex items-center justify-center font-mono">
                  {totalWaiting}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/barber/dashboard')}
              className={`flex-1 max-w-[200px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all relative ${
                currentPath === '/barber/dashboard'
                  ? 'bg-theme-bg-tab-selected text-neutral-100 border border-neutral-700/50 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span className="text-xs font-bold font-mono">Barbiers</span>
            </button>

            <button
              onClick={() => navigate('/barber/accounting')}
              className={`flex-1 max-w-[200px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all relative ${
                currentPath === '/barber/accounting'
                  ? 'bg-theme-bg-tab-selected text-neutral-100 border border-neutral-700/50 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-bold font-mono">Compta</span>
            </button>
          </div>
        </nav>
      )}

      {/* Main interactive content area - full width & responsive */}
      <main className="w-full flex-1 flex flex-col items-center bg-neutral-950 text-neutral-200 transition-colors duration-200">
        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="w-full flex-1"
            >
              {(currentPath === '/' || currentPath.startsWith('/shop/') || currentPath.startsWith('/ticket/') || currentRole === 'client') && <ClientView />}
              {currentPath === '/barber/dashboard' && <BarberDashboard />}
              {currentPath === '/barber/accounting' && <AccountingView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Embedded Help Guide floating panel for barbers */}
      {isBarberSide && <HelpGuide />}

      {/* Footer */}
      <footer className="w-full py-4 text-center border-t border-theme-border-header bg-theme-bg-header/50">
        <p className="text-[11px] text-neutral-600 font-mono">
          © 2026 Barber_Pro · Solution de file d'attente en temps réel
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BarberProvider>
      <AppContent />
    </BarberProvider>
  );
}

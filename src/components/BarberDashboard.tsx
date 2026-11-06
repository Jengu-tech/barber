/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useBarber } from '../context/BarberContext';
import { formatFCFA } from '../utils';
import { QueueItem } from '../types';
import { Play, Sparkles, CheckCircle2, UserCheck, FastForward, Clock, ToggleLeft, ToggleRight, XCircle, Power, User, HelpCircle, QrCode, Download, Plus, Settings, ClipboardList, Trash2, Scissors, Save, Image, Upload, Link, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';

export default function BarberDashboard() {
  const {
    shopName,
    barbers,
    services,
    queue,
    activeBarberId,
    setActiveBarberId,
    startClientSession,
    completeClientSession,
    skipClientSession,
    cancelClientSession,
    toggleBarberStatus,
    setShopName,
    addBarberCount,
    removeBarberCount,
    addServiceCount,
    removeServiceCount,
    shopCoverUrl,
    setShopCoverUrl,
  } = useBarber();

  const [activeTab, setActiveTab] = useState<'queue' | 'settings'>('queue');
  const selectedBarber = barbers.find((b) => b.id === activeBarberId) || barbers[0];

  // Forms states for parameters
  const [shopNameInput, setShopNameInput] = useState(shopName);
  const [coverUrlInput, setCoverUrlInput] = useState(shopCoverUrl || '');
  const [imageError, setImageError] = useState<string | null>(null);

  const presets = [
    {
      name: 'Moderne Bois',
      url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Chaleureux Rétro',
      url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Salon Vintage',
      url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Design Épuré',
      url: 'https://images.unsplash.com/photo-1599351431247-f5793080e122?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const handleApplyPreset = (url: string) => {
    setShopCoverUrl(url);
    setImageError(null);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (coverUrlInput.trim()) {
      setShopCoverUrl(coverUrlInput.trim());
      setImageError(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError("Le fichier sélectionné doit être une image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
            setShopCoverUrl(compressedBase64);
            setCoverUrlInput('');
            setImageError(null);
          } catch (err: any) {
            console.error("Canvas conversion failed:", err);
            setImageError("Impossible de convertir le fichier. Utilisez un lien ou une image plus petite.");
          }
        }
      };
      img.onerror = () => {
        setImageError("Fichier image illisible.");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setImageError("Erreur lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };
  
  // Barber Account addition Form
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberSpecialties, setNewBarberSpecialties] = useState('');
  const [newBarberAvgTime, setNewBarberAvgTime] = useState('20');

  // Service addition Form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('20');

  // List of waitlist for active barber
  const activeBarberQueue = queue.filter(
    (q) => q.barberId === selectedBarber.id && q.status === 'waiting'
  );

  // Active client currently in seat
  const currentActiveClient = queue.find(
    (q) => q.barberId === selectedBarber.id && q.status === 'active'
  );

  // Count-up timer of current active client
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  useEffect(() => {
    setShopNameInput(shopName);
  }, [shopName]);

  useEffect(() => {
    if (shopCoverUrl) {
      setCoverUrlInput(shopCoverUrl);
    }
  }, [shopCoverUrl]);

  useEffect(() => {
    if (!currentActiveClient || !currentActiveClient.startedAt) {
      setElapsedTime('00:00');
      return;
    }

    const updateTimer = () => {
      const start = new Date(currentActiveClient.startedAt!).getTime();
      const now = Date.now();
      const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
      
      const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const ss = (totalSeconds % 60).toString().padStart(2, '0');
      setElapsedTime(`${mm}:${ss}`);
    };

    updateTimer(); // update immediately
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [currentActiveClient?.id, currentActiveClient?.startedAt]);

  // Handler to call first person in line
  const handleCallNext = () => {
    if (activeBarberQueue.length > 0) {
      startClientSession(activeBarberQueue[0].id);
    }
  };

  const handleUpdateShopName = (e: React.FormEvent) => {
    e.preventDefault();
    if (shopNameInput.trim()) {
      setShopName(shopNameInput.trim());
    }
  };

  const handleAddBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBarberName.trim()) {
      const specs = newBarberSpecialties.split(',').map((s) => s.trim()).filter(Boolean);
      const added = addBarberCount(
        newBarberName.trim(),
        specs.length > 0 ? specs : ['Coupe Classique'],
        Number(newBarberAvgTime) || 20
      );
      // Auto-switch to newly created barber context
      setActiveBarberId(added.id);
      setNewBarberName('');
      setNewBarberSpecialties('');
      setNewBarberAvgTime('20');
    }
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (newServiceName.trim() && newServicePrice) {
      addServiceCount(
        newServiceName.trim(),
        Number(newServicePrice) || 1000,
        Number(newServiceDuration) || 20
      );
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration('20');
    }
  };

  const [shopId, setShopId] = useState<string>(() => {
    return localStorage.getItem('barberq_shop_id') || 'default-shop';
  });

  useEffect(() => {
    async function loadShopId() {
      try {
        const { supabase } = await import('../lib/supabase');
        if (!supabase) return;
        const { data } = await supabase.from('shops').select('id').limit(1);
        if (data && data.length > 0) {
          setShopId(data[0].id);
          localStorage.setItem('barberq_shop_id', data[0].id);
        }
      } catch (err) {
        console.error("Failed to load shop ID in dashboard:", err);
      }
    }
    loadShopId();
  }, []);

  let origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  const qrUrl = origin + '/shop/' + shopId;

  const downloadQRCode = () => {
    const canvas = document.getElementById('client-qr-gen') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${shopName.replace(/\s+/g, "_")}_QR_Code.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const printQRCode = () => {
    const canvas = document.getElementById('client-qr-gen') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code ${shopName}</title>
              <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; background: #fafafa; }
                .card { background: white; border: 2px solid #ddd; border-radius: 20px; padding: 40px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 400px; }
                h1 { margin-bottom: 5px; font-size: 24px; color: #111; }
                p { color: #666; font-size: 14px; margin-bottom: 30px; }
                img { width: 280px; height: 280px; }
                .url-text { margin-top: 15px; font-family: monospace; font-size: 12px; color: #444; word-break: break-all; font-weight: bold; background: #f3f4f6; padding: 8px 12px; border-radius: 8px; border: 1px dashed #ccc; }
                .footer { margin-top: 20px; font-size: 12px; color: #999; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>\${shopName}</h1>
                <p>Scannez pour rejoindre la file d'attente</p>
                <img src="\${pngUrl}" />
                <div class="url-text">\${qrUrl}</div>
                <div class="footer">Aucune app à installer !</div>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Connected Dashboard Header with Logout */}
      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-neutral-400 font-mono tracking-wider uppercase">Session Active</span>
        </div>
        <button
          onClick={async () => {
            const { dbSignOut } = await import('../lib/supabase');
            try {
              await dbSignOut();
              window.location.href = '/barber/login';
            } catch (err) {
              console.error(err);
              window.location.href = '/barber/login';
            }
          }}
          className="text-white hover:text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer font-mono uppercase tracking-wider"
        >
          <Power className="w-3.5 h-3.5" />
          Déconnexion
        </button>
      </div>

      {/* Barber navigation sub-tabs */}
      <div className="flex bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'queue'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Gérer la File
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'settings'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          Profil & QR Code
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'queue' ? (
          <motion.div
            key="tab-queue"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Barber Selector top panel */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2.5">
                Sélectionner la Tablette Coiffeur
              </label>
              <div className="grid grid-cols-3 gap-2">
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setActiveBarberId(b.id)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all truncate text-center ${
                      activeBarberId === b.id
                        ? 'bg-white text-neutral-950 border-white font-bold'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-850 hover:border-neutral-800 hover:text-white'
                    }`}
                  >
                    {b.initials} · {b.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Barber Header */}
            <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
              <div>
                <p className="text-[11px] text-neutral-500 font-medium">Bonjour,</p>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1">
                  {selectedBarber.name} ✂️
                </h3>
              </div>

              {/* Status indicator button */}
              <button
                onClick={() => toggleBarberStatus(selectedBarber.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all outline-none ${
                  selectedBarber.status === 'online'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-neutral-850 text-neutral-500 border border-neutral-750'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${selectedBarber.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-neutral-500'}`}></span>
                {selectedBarber.status === 'online' ? 'Disponible' : 'Absent'}
              </button>
            </div>

            {/* Client En Cours Section */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 relative overflow-hidden">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">
                Client Actuel Aux Ciseaux
              </p>

              <AnimatePresence mode="wait">
                {currentActiveClient ? (
                  <motion.div
                    key={currentActiveClient.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white text-neutral-900 font-bold flex items-center justify-center text-sm shadow-md shadow-white/5 border border-neutral-800">
                        {currentActiveClient.clientName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">
                          {currentActiveClient.clientName}
                        </h4>
                        <p className="text-xs text-neutral-400 truncate">
                          {currentActiveClient.serviceName}
                        </p>
                        {currentActiveClient.phone && (
                          <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                            📞 {currentActiveClient.phone}
                          </p>
                        )}
                      </div>
                      {/* Working countup timer */}
                      <div className="text-right">
                        <span className="text-xl font-mono font-bold text-white flex items-center gap-1.5 justify-end">
                          <Clock className="w-4 h-4 text-green-400 animate-pulse" />
                          {elapsedTime}
                        </span>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          Inscrit : {formatFCFA(currentActiveClient.price)}
                        </p>
                      </div>
                    </div>

                    {/* Action grid layout */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => completeClientSession(currentActiveClient.id)}
                        className="bg-green-400 hover:bg-green-500 text-black font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-green-550/25 active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Terminé
                      </button>
                      <button
                        onClick={() => skipClientSession(currentActiveClient.id)}
                        className="bg-neutral-850 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                      >
                        <FastForward className="w-3.5 h-3.5" />
                        Passer
                      </button>
                      <button
                        onClick={() => cancelClientSession(currentActiveClient.id)}
                        className="bg-red-950/20 hover:bg-red-950/35 text-red-400 border border-red-900/40 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Annuler
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-client"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6 px-4 border border-dashed border-neutral-800 rounded-xl bg-neutral-950"
                  >
                    <UserCheck className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-neutral-300">Aucun client en cours</p>
                    <p className="text-[11px] text-neutral-500 mt-1 max-w-[200px] mx-auto">
                      La chaise est libre. Cliquez pour faire passer le premier client de votre file.
                    </p>
                    <button
                      onClick={handleCallNext}
                      disabled={activeBarberQueue.length === 0}
                      className="mt-4 bg-white hover:bg-neutral-100 disabled:bg-neutral-900 disabled:text-neutral-600 outline-none text-neutral-950 text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors inline-flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Appeler le suivant
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* File d'attente specific cards lists */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  File d'Attente ({activeBarberQueue.length})
                </p>
                <span className="text-[10px] text-green-400 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-850 font-medium">
                  {selectedBarber.name}
                </span>
              </div>

              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {activeBarberQueue.length > 0 ? (
                  activeBarberQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 bg-neutral-950 border border-neutral-850 rounded-xl hover:border-neutral-800 transition-colors"
                    >
                      <span className="text-xs font-mono font-bold text-neutral-500 w-5">
                        #{index + 1}
                      </span>

                      <div className="w-8 h-8 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.clientName.substring(0, 1).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {item.clientName}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                          {item.serviceName} {item.phone ? `· 📞 ${item.phone}` : ''}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-1.5 shrink-0">
                        <div className="text-right">
                          <p className="text-[11px] text-neutral-400 font-mono">
                            ~{(index + 1) * selectedBarber.avgTime}m
                          </p>
                          <p className="text-[9px] text-neutral-600 font-bold">
                            {formatFCFA(item.price)}
                          </p>
                        </div>
                        <button
                          onClick={() => startClientSession(item.id)}
                          className="p-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-neutral-950 transition-colors shadow-sm"
                          title="Commencer ce ticket"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-neutral-500 text-xs flex flex-col items-center justify-center border border-dashed border-neutral-850 rounded-xl bg-neutral-950">
                    <User className="w-6 h-6 text-neutral-700 mb-1" />
                    File vide pour le moment
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* CONFIGURATION TAB & QR CODE VIEW */
          <motion.div
            key="tab-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Salon parameters */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                🏢 Configuration générale du Salon
              </h4>
              <form onSubmit={handleUpdateShopName} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                    Nom de votre établissement
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-neutral-950 border border-neutral-850 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-green-550 transition-colors"
                      value={shopNameInput}
                      onChange={(e) => setShopNameInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-white text-neutral-950 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 hover:bg-neutral-200"
                    >
                      <Save className="w-3.5 h-3.5" /> Sauver
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-4 pt-4 border-t border-neutral-855 space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2">
                    Photo de Couverture du Salon (Boutique Client)
                  </label>
                  
                  {/* Current Preview or Placeholder */}
                  <div className="relative w-full h-32 rounded-xl bg-neutral-950 overflow-hidden border border-neutral-800 mb-3 group flex items-center justify-center">
                    {shopCoverUrl ? (
                      <>
                        <img
                          src={shopCoverUrl}
                          alt="Prévisualisation couverture"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-neutral-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setShopCoverUrl('');
                              setCoverUrlInput('');
                            }}
                            className="bg-red-650 hover:bg-red-650 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            Retirer la photo
                          </button>
                        </div>
                        <div className="absolute top-2 left-2 bg-neutral-950/70 backdrop-blur-md text-[9px] text-white font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 select-none font-mono uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Couverture active
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Image className="w-7 h-7 text-neutral-600 mx-auto mb-1.5" />
                        <p className="text-[10px] text-neutral-400 font-bold">Aucune photo personnalisée</p>
                        <p className="text-[9px] text-neutral-500 mt-0.5">Le salon utilise le fond dégradé officiel</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {/* Image File input trigger */}
                    <div className="relative">
                      <input
                        type="file"
                        id="cover-file-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <label
                        htmlFor="cover-file-upload"
                        className="w-full h-full min-h-[38px] flex items-center justify-center gap-1.5 bg-neutral-950 border border-neutral-850 hover:border-neutral-750 text-neutral-300 text-[11px] font-bold rounded-xl py-2 px-3 cursor-pointer transition-colors text-center"
                      >
                        <Upload className="w-3.5 h-3.5 text-neutral-400" />
                        Uploader un fichier
                      </label>
                    </div>

                    {/* Image URL Form */}
                    <form onSubmit={handleApplyUrl} className="flex gap-1.5">
                      <input
                        type="url"
                        placeholder="Lien URL de la photo..."
                        className="flex-1 bg-neutral-950 border border-neutral-850 text-white text-[11px] rounded-xl px-3 outline-none focus:border-green-550 transition-colors"
                        value={coverUrlInput}
                        onChange={(e) => setCoverUrlInput(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-bold px-3 rounded-xl flex items-center justify-center cursor-pointer"
                        title="Appliquer l'URL"
                      >
                        <Link className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>

                  {/* Presets Gallery */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest font-mono">
                      Ou choisissez parmi nos salons modèles :
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {presets.map((preset) => {
                        const isSelected = shopCoverUrl === preset.url;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleApplyPreset(preset.url)}
                            className={`group relative h-11 rounded-lg overflow-hidden border transition-all ${
                              isSelected
                                ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md scale-[1.02]'
                                : 'border-neutral-850 hover:border-neutral-700'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-neutral-950/40 flex items-end p-1">
                              <span className="text-[8px] text-white font-medium truncate w-full text-center">
                                {preset.name}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5 shadow">
                                <Check className="w-2 h-2 text-neutral-950 stroke-[3.5]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Errors display */}
                  {imageError && (
                    <p className="text-red-500 text-[10px] font-semibold mt-2">
                       ⚠️ {imageError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code printing */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 text-left flex items-center gap-1.5">
                📥 Imprimer votre QR Code Client
              </h4>
              <p className="text-[11px] text-neutral-400 text-left mb-4">
                Collez ce QR Code devant votre boutique ou près de l'accueil. Les clients le scannent pour prendre leur ticket sans installer d'app !
              </p>

              <div className="bg-white p-3.5 rounded-2xl inline-block shadow-md">
                <QRCodeCanvas
                  id="client-qr-gen"
                  value={qrUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                  className="mx-auto block"
                />
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-mono text-neutral-400 select-all font-bold tracking-tight break-all border border-neutral-800 bg-neutral-950 p-2 rounded-xl border-dashed max-w-xs mx-auto">
                  {qrUrl}
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={downloadQRCode}
                    className="inline-flex items-center gap-1.5 bg-neutral-800 text-xs text-neutral-300 font-semibold px-4.5 py-2 rounded-xl hover:bg-neutral-750 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger PNG
                  </button>
                  <button
                    onClick={printQRCode}
                    className="inline-flex items-center gap-1.5 bg-white text-xs text-neutral-900 font-bold px-4.5 py-2 rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    🖨️ Imprimer la fiche QR
                  </button>
                </div>
              </div>
            </div>

            {/* Barber accounts dynamic additions */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                💈 Créer un compte coiffeur / Barbier
              </h4>

              <form onSubmit={handleAddBarber} className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">Nom du coiffeur</label>
                    <input
                      type="text"
                      className="w-full bg-neutral-950 border border-neutral-850 text-white text-xs rounded-xl px-3 py-2 outline-none"
                      placeholder="Ex: Amara Touré"
                      required
                      value={newBarberName}
                      onChange={(e) => setNewBarberName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">Temps moyen coupe (min)</label>
                    <input
                      type="number"
                      className="w-full bg-neutral-950 border border-neutral-850 text-white text-xs rounded-xl px-3 py-2 outline-none"
                      placeholder="Ex: 25"
                      required
                      value={newBarberAvgTime}
                      onChange={(e) => setNewBarberAvgTime(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">Spécialités (séparées par une virgule)</label>
                  <input
                    type="text"
                    className="w-full bg-neutral-950 border border-neutral-850 text-white text-xs rounded-xl px-3 py-2 outline-none"
                    placeholder="Ex: Barbe, Wave, Dégradé..."
                    value={newBarberSpecialties}
                    onChange={(e) => setNewBarberSpecialties(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 inline-block mr-1" /> Ajouter ce coiffeur
                </button>
              </form>

              {/* List of existing */}
              <div className="space-y-1.5 border-t border-neutral-800 pt-3">
                <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Coiffeurs enregistrés ({barbers.length})</p>
                {barbers.map((b) => (
                  <div key={b.id} className="flex justify-between items-center text-xs p-2 bg-neutral-950 border border-neutral-850 rounded-lg">
                    <span>
                      <strong className="text-white">{b.name}</strong> ({b.avgTime}m par coupe)
                    </span>
                    {barbers.length > 1 && (
                      <button
                        onClick={() => removeBarberCount(b.id)}
                        className="text-neutral-500 hover:text-red-400 p-1"
                        title="Supprimer ce compte"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Services and pricing setup */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                ✂️ Configurer Prestations & Tarifs
              </h4>

              <form onSubmit={handleAddService} className="space-y-3 mb-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10px] text-neutral-400 mb-1">Nom du service</label>
                    <input
                      type="text"
                      className="w-full bg-neutral-950 border border-neutral-850 text-white text-xs rounded-xl px-3 py-2 outline-none"
                      placeholder="Ex: Rasage Crane"
                      required
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">Prix (FCFA / GNF)</label>
                    <input
                      type="number"
                      className="w-full bg-neutral-950 border border-neutral-850 text-white text-xs rounded-xl px-3 py-2 outline-none"
                      placeholder="Ex: 1500"
                      required
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1">Durée (mins)</label>
                    <input
                      type="number"
                      className="w-full bg-neutral-950 border border-neutral-850 text-white text-xs rounded-xl px-3 py-2 outline-none"
                      placeholder="Ex: 15"
                      required
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 inline-block mr-1" /> Ajouter cette prestation
                </button>
              </form>

              {/* List of existing services */}
              <div className="space-y-1.5 border-t border-neutral-800 pt-3">
                <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Prestations disponibles ({services.length})</p>
                {services.map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-xs p-2 bg-neutral-950 border border-neutral-850 rounded-lg">
                    <div>
                      <span className="text-white font-semibold">{s.name}</span>
                      <span className="text-neutral-500 font-mono text-[10px] ml-1.5">{s.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300 font-mono font-bold text-[10px]">
                        {formatFCFA(s.price)}
                      </span>
                      {services.length > 1 && (
                        <button
                          onClick={() => removeServiceCount(s.id)}
                          className="text-neutral-500 hover:text-red-400 p-1"
                          title="Supprimer la prestation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

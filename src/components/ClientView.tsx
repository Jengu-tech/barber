/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useBarber } from '../context/BarberContext';
import { Service } from '../types';
import { getEstimatedWaitTime, formatFCFA } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Clock, Users, Flame, ChevronRight, Sparkles, Check, User, ArrowLeft, Trash2, Calendar } from 'lucide-react';

export default function ClientView() {
  const {
    shopName,
    shopAddress,
    shopCoverUrl,
    shopLogoUrl,
    shopIsOpen,
    barbers,
    services,
    queue,
    joinQueue,
    leaveQueue,
    clientActiveTicketId,
  } = useBarber();

  const [currentUrlPath, setCurrentUrlPath] = useState(window.location.pathname);

  // Maintain client path routing state
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentUrlPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const getPreselectedBarberId = () => {
    if (currentUrlPath.startsWith('/shop/') && currentUrlPath.includes('/join/')) {
      const parts = currentUrlPath.split('/');
      if (parts.length >= 5) {
        return parts[4];
      }
    }
    return null;
  };

  const getTicketIdFromPath = () => {
    if (currentUrlPath.startsWith('/ticket/')) {
      return currentUrlPath.split('/').pop() || null;
    }
    return null;
  };

  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(() => {
    return getPreselectedBarberId();
  });

  useEffect(() => {
    const preMatch = getPreselectedBarberId();
    if (preMatch) {
      setSelectedBarberId(preMatch);
    } else {
      setSelectedBarberId(null);
    }
  }, [currentUrlPath]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientActiveElapsedTime, setClientActiveElapsedTime] = useState<string>('00:00');

  // Active client ticket if registered in local session or from URL route
  const ticketIdFromPath = getTicketIdFromPath();
  const activeTicketId = ticketIdFromPath || clientActiveTicketId;
  const activeTicket = queue.find((q) => q.id === activeTicketId);

  useEffect(() => {
    if (!activeTicket || activeTicket.status !== 'active' || !activeTicket.startedAt) {
      setClientActiveElapsedTime('00:00');
      return;
    }

    const updateTimer = () => {
      const start = new Date(activeTicket.startedAt!).getTime();
      const now = Date.now();
      const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
      const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const ss = (totalSeconds % 60).toString().padStart(2, '0');
      setClientActiveElapsedTime(`${mm}:${ss}`);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [activeTicket?.id, activeTicket?.status, activeTicket?.startedAt]);

  // Helper info for selected barber
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  // Handle joining queue
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarberId || !clientName.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newItem = joinQueue(clientName.trim(), clientPhone.trim(), selectedBarberId, selectedServiceId);
      setIsSubmitting(false);
      // Reset form states
      setClientName('');
      setClientPhone('');
      setSelectedBarberId(null);
      // Navigate to the ticket page
      window.history.pushState({}, '', `/ticket/${newItem.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, 600);
  };

  const handleLeaveQueue = (ticketId: string) => {
    leaveQueue(ticketId);
    const shopId = localStorage.getItem('barberq_shop_id') || 'default-shop';
    window.history.pushState({}, '', `/shop/${shopId}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Compute stats for a single barber
  const getBarberStats = (barberId: string, barberAvgTime: number) => {
    const barberQueue = queue.filter(
      (q) => q.barberId === barberId && (q.status === 'waiting' || q.status === 'active')
    );
    const waitingCount = barberQueue.length;
    const estTime = getEstimatedWaitTime(queue, barberId, barberAvgTime);
    
    return {
      waitingCount,
      estTime,
    };
  };

  // Find exact index of active user's ticket in the queue
  const getQueuePosition = () => {
    if (!activeTicket) return 0;
    
    // Position is number of "waiting" or "active" people in line before of after (excluding completed/cancelled)
    const barberQueue = queue.filter(
      (q) => q.barberId === activeTicket.barberId && q.status === 'waiting'
    );
    
    const activePerson = queue.find(
      (q) => q.barberId === activeTicket.barberId && q.status === 'active'
    );

    const matchIndex = barberQueue.findIndex((q) => q.id === activeTicket.id);
    
    // If active ticket status is already active, position is 1
    if (activeTicket.status === 'active') {
      return 1;
    }
    
    // Else, position is activePerson counter + index in waitlist + 1
    return (activePerson ? 1 : 0) + matchIndex + 1;
  };

  // Get general wait position stats
  const getProgressStats = () => {
    if (!activeTicket) return { totalInLine: 0, currentPosition: 0, completedCount: 0 };
    
    const barberQueue = queue.filter(
      (q) => q.barberId === activeTicket.barberId && (q.status === 'waiting' || q.status === 'active')
    );
    
    const completedToday = queue.filter(
      (q) => q.barberId === activeTicket.barberId && q.status === 'completed'
    ).length;

    const currentPos = getQueuePosition();
    return {
      totalInLine: barberQueue.length,
      currentPosition: currentPos,
      completedCount: completedToday,
    };
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {/* VIEW 1: ACTIVE DIGITAL TICKET */}
        {activeTicket && (activeTicket.status === 'waiting' || activeTicket.status === 'active') ? (
          <motion.div
            key="ticket-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-3"
          >
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/50 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                Ticket En Direct
              </span>
              <p className="text-sm font-medium text-neutral-400">{shopName}</p>
              <h3 className="text-base font-semibold text-white/90">
                Barbier : {barbers.find((b) => b.id === activeTicket.barberId)?.name || 'Moussa Keïta'}
              </h3>
            </div>

            {/* Print Ticket layout */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-neutral-200 text-neutral-800 mb-5">
              {/* Top ticket part */}
              <div className="bg-neutral-900 px-6 py-6 text-center text-white relative">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest block mb-1">
                  Ta Position Active
                </span>
                <h1 className="text-6xl font-bold font-mono tracking-tight leading-none my-1">
                  {getQueuePosition()}
                </h1>
                <p className="text-xs text-neutral-400 mt-2">
                  dans la file d'attente
                </p>
                {activeTicket.status === 'active' && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse font-mono">
                    <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" /> {clientActiveElapsedTime}
                  </div>
                )}
              </div>

              {/* Seamless ticket notches dashed border */}
              <div className="flex items-center bg-white h-5 pointer-events-none relative z-10">
                <div className="w-4 h-4 rounded-full bg-neutral-900 -ml-2 border-r border-neutral-200"></div>
                <div className="flex-1 border-t-2 border-dashed border-neutral-200 mx-2"></div>
                <div className="w-4 h-4 rounded-full bg-neutral-900 -mr-2 border-l border-neutral-200"></div>
              </div>

              {/* Bottom details and billing summary */}
              <div className="px-5 pb-6 pt-2 bg-white space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                  <span className="text-xs text-neutral-400 font-medium">Prénom</span>
                  <span className="text-sm text-neutral-800 font-semibold">{activeTicket.clientName}</span>
                </div>
                {activeTicket.phone && (
                  <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                    <span className="text-xs text-neutral-400 font-medium">Numéro de tél.</span>
                    <span className="text-sm text-neutral-850 font-semibold">{activeTicket.phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                  <span className="text-xs text-neutral-400 font-medium">Service sollicité</span>
                  <span className="text-sm text-neutral-800 font-semibold">{activeTicket.serviceName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                  <span className="text-xs text-neutral-400 font-medium">Prix estimé</span>
                  <span className="text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1 rounded-md">
                    {formatFCFA(activeTicket.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-neutral-400 font-medium">Temps d'attente estimé</span>
                  <span className="text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-md flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    {activeTicket.status === 'active' ? `En cours (~${clientActiveElapsedTime})` : `~${getEstimatedWaitTime(queue, activeTicket.barberId, barbers.find((b) => b.id === activeTicket.barberId)?.avgTime || 20)} min`}
                  </span>
                </div>
              </div>
            </div>

            {/* Waiting list progress bars */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-neutral-400">Avancement de la file</span>
                <span className="text-xs font-semibold text-green-400">
                  Position {getQueuePosition()} de {getProgressStats().totalInLine} clients
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      10,
                      Math.min(
                        100,
                        ((getProgressStats().totalInLine - getQueuePosition() + 1) /
                          Math.max(1, getProgressStats().totalInLine)) *
                          100
                      )
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500 mt-2">
                <span>{getProgressStats().completedCount} coupes terminées aujourd'hui</span>
                <span>File d'attente fluide</span>
              </div>
            </div>

            <button
              onClick={() => handleLeaveQueue(activeTicket.id)}
              className="w-full bg-neutral-900 hover:bg-red-950/20 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-900/40 rounded-xl py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Abandonner / Quitter la file d'attente
            </button>
          </motion.div>
        ) : (
          /* VIEW 2: BROWSE BARBERSHOP & JOIN LINE */
          <motion.div
            key="browse-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full bg-neutral-50 min-h-screen text-neutral-800"
          >
            {/* PHOTO DE COUVERTURE */}
            <div className="relative w-full h-[220px] bg-neutral-950 overflow-hidden">
              {shopCoverUrl ? (
                <img
                  src={shopCoverUrl}
                  alt="Couverture"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#26160a] flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="w-full h-full grid grid-cols-6 grid-rows-4">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="border-r border-b border-white"></div>
                      ))}
                    </div>
                  </div>
                  <span className="text-7xl text-white/5 font-sans transform -rotate-15">✂️</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute top-4 left-4 text-[10px] font-mono uppercase tracking-widest text-neutral-300 bg-neutral-950/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-neutral-800">
                Barber_Pro
              </div>
            </div>

            {/* PROFIL BOUTIQUE */}
            <div className="bg-white px-5 pt-3 pb-4 border-b border-neutral-200">
              <div className="flex items-end gap-3.5 mb-2.5">
                {shopLogoUrl ? (
                  <img
                    src={shopLogoUrl}
                    alt="Logo"
                    className="w-20 h-20 rounded-full object-cover border-[3px] border-white shadow-xl -mt-10 shrink-0 bg-neutral-950"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-neutral-900 text-white flex items-center justify-center font-black text-2xl border-[3px] border-white shadow-xl -mt-10 shrink-0 select-none uppercase font-mono">
                    {shopName.split(' ').map(n => n[0]).join('').substring(0, 2) || "BP"}
                  </div>
                )}
                <div className="flex-1 min-w-0 pb-1">
                  <h3 className="text-lg font-black text-neutral-900 tracking-tight leading-snug">{shopName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${shopIsOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-xs font-bold text-neutral-750">
                      {shopIsOpen ? 'Ouvert · jusqu\'à 20h' : 'Fermé · Réouverture demain'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 mt-1 font-mono">
                📍 {shopAddress}
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 bg-white border-b border-neutral-200">
              <div className="py-3 px-2 text-center border-r border-neutral-200/60">
                <span className="text-lg font-black text-neutral-900 block font-mono">4.9★</span>
                <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider block mt-0.5">Note</span>
              </div>
              <div className="py-3 px-2 text-center border-r border-neutral-200/60">
                <span className="text-lg font-black text-neutral-900 block font-mono">
                  {queue.filter((q) => q.status === 'waiting' || q.status === 'active').length}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider block mt-0.5">En Ligne</span>
              </div>
              <div className="py-3 px-2 text-center">
                <span className="text-lg font-black text-emerald-500 block font-mono">Live</span>
                <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider block mt-0.5">File</span>
              </div>
            </div>

            <div className="p-4 space-y-6">
              <AnimatePresence mode="wait">
                {!selectedBarberId ? (
                  /* Step A: Choose Barber & View Categorized Services list */
                  <motion.div
                    key="step-barber"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    {/* BARBIERS GRID SECTION */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 px-0.5">
                        <Scissors className="w-4 h-4 text-neutral-900" />
                        <h4 className="text-xs font-black text-neutral-900 uppercase tracking-widest">
                          Choisir Votre Coiffeur
                        </h4>
                      </div>

                      <div className="grid gap-2.5">
                        {barbers.map((barber) => {
                          const stats = getBarberStats(barber.id, barber.avgTime);
                          const isOffline = barber.status === 'offline';
                          return (
                            <div
                              key={barber.id}
                              onClick={() => {
                                if (!isOffline) {
                                  setSelectedBarberId(barber.id);
                                  const shopId = localStorage.getItem('barberq_shop_id') || 'default-shop';
                                  window.history.pushState({}, '', `/shop/${shopId}/join/${barber.id}`);
                                  window.dispatchEvent(new PopStateEvent('popstate'));
                                }
                              }}
                              className={`group relative flex items-center gap-3.5 p-3.5 bg-white border border-neutral-200 hover:bg-neutral-100/65 rounded-2xl transition-all shadow-sm ${
                                isOffline
                                  ? 'opacity-55 cursor-not-allowed'
                                  : 'active:scale-[0.98] cursor-pointer'
                              }`}
                            >
                              <div
                                className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black border border-neutral-100 uppercase shrink-0 ${
                                  isOffline
                                    ? 'bg-neutral-100 text-neutral-400'
                                    : 'bg-neutral-900 text-white shadow-sm'
                                }`}
                              >
                                {barber.initials}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-sm font-black text-neutral-900 group-hover:text-amber-600 transition-colors">
                                    {barber.name}
                                  </h4>
                                  {isOffline && (
                                    <span className="text-[9px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-450 font-black tracking-wider uppercase">
                                      Absent
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-neutral-500 font-semibold truncate mt-0.5">
                                  {barber.specialties.join(' · ')}
                                </p>
                              </div>

                              {!isOffline ? (
                                <div className="text-right flex items-center gap-2 shrink-0">
                                  <div>
                                    <span className="text-base font-black font-mono text-neutral-900 block leading-none">
                                      {stats.waitingCount}
                                    </span>
                                    <span className={`text-[9px] font-mono font-black uppercase tracking-wider block mt-1 ${stats.estTime === 0 ? 'text-emerald-500' : 'text-amber-550'}`}>
                                      {stats.estTime === 0 ? 'Disponible' : `~${stats.estTime}m`}
                                    </span>
                                  </div>
                                  <span className="text-neutral-350 text-xl font-black group-hover:translate-x-0.5 transition-transform pointer-events-none">›</span>
                                </div>
                              ) : (
                                <span className="text-neutral-350 text-xl font-black group-hover:translate-x-0.5 transition-transform shrink-0">›</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SERVICES SECTION */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-1.5 px-0.5">
                        <span className="text-base">💈</span>
                        <h4 className="text-xs font-black text-neutral-900 uppercase tracking-widest">
                          Nos services et tarifs
                        </h4>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(
                          services.reduce((acc, s) => {
                            const cat = s.category || 'Coupes';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(s);
                            return acc;
                          }, {} as Record<string, Service[]>)
                        ).map(([catName, list]) => (
                          <div key={catName} className="space-y-2">
                            <span className="text-[9px] font-mono font-black text-neutral-400 tracking-widest block uppercase px-1">
                              {catName}
                            </span>
                            <div className="grid gap-2">
                              {(list as Service[]).map((s) => {
                                const isBarbe = s.name.toLowerCase().includes('barbe') || s.id.includes('barbe') || s.name.toLowerCase().includes('rasage');
                                const isSoin = s.name.toLowerCase().includes('soin') || s.name.toLowerCase().includes('masque') || s.name.toLowerCase().includes('shampoing') || s.id.includes('soin');
                                const svcIcon = isBarbe ? '🪒' : isSoin ? '💆' : '✂️';
                                
                                return (
                                  <div
                                    key={s.id}
                                    className="flex items-center justify-between p-3.5 bg-white border border-neutral-200 rounded-2xl shadow-sm hover:bg-neutral-100/60 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-lg shrink-0">
                                        {svcIcon}
                                      </div>
                                      <div>
                                        <p className="text-xs font-black text-neutral-900 leading-snug">
                                          {s.name}
                                        </p>
                                        <p className="text-[10px] text-neutral-500 font-semibold flex items-center gap-1.5 mt-0.5 font-mono">
                                          <Clock className="w-3.5 h-3.5" />
                                          {s.duration} mins de coiffe
                                        </p>
                                      </div>
                                    </div>

                                    <span className="bg-neutral-900 text-white font-mono font-bold text-xs py-1.5 px-3 rounded-full shrink-0 shadow-sm border border-neutral-950">
                                      {formatFCFA(s.price)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Step B: Fill Check-in Details */
                  <motion.div
                    key="step-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm"
                  >
                    <button
                      onClick={() => {
                        setSelectedBarberId(null);
                        const shopId = localStorage.getItem('barberq_shop_id') || 'default-shop';
                        window.history.pushState({}, '', `/shop/${shopId}`);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-600 hover:text-neutral-900 mb-5 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Changer de coiffeur
                    </button>

                    <h4 className="text-sm font-black text-neutral-950 mb-1">Prendre Un Ticket</h4>
                    <p className="text-xs text-neutral-500 mb-4 select-none">
                      Coiffeur sélectionné : <span className="text-amber-600 font-extrabold">{selectedBarber?.name}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Name client Input */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                          Votre Prénom / Nom <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Ex: Thierno, Daouda, Seydou..."
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            maxLength={25}
                            className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:bg-white outline-none text-neutral-900 text-xs font-semibold rounded-xl py-3 pl-3.5 pr-10 transition-all shadow-sm"
                          />
                          <User className="absolute right-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                        </div>
                      </div>

                      {/* Phone client Input */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                          Votre Numéro de téléphone <span className="text-neutral-400 text-[9px] lowercase font-normal">(optionnel)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder="Ex: +224 622 00 00 00"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            maxLength={20}
                            className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:bg-white outline-none text-neutral-900 text-xs font-semibold rounded-xl py-3 pl-3.5 pr-10 transition-all shadow-sm"
                          />
                          <span className="absolute right-3.5 top-3.5 text-xs text-neutral-400 font-mono select-none">📱</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-medium mt-1 leading-normal">
                          Sert au coiffeur pour vous contacter ou vous envoyer votre reçu.
                        </p>
                      </div>

                      {/* Service Selector */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                          Prestation demandée
                        </label>
                        <div className="space-y-2">
                          {services.map((service) => (
                            <label
                              key={service.id}
                              onClick={() => setSelectedServiceId(service.id)}
                              className={`flex justify-between items-center p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                                selectedServiceId === service.id
                                  ? 'bg-neutral-900 border-neutral-950 text-white shadow-sm'
                                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  selectedServiceId === service.id ? 'border-amber-400' : 'border-neutral-300'
                                }`}>
                                  {selectedServiceId === service.id && <div className="w-2 h-2 rounded-full bg-amber-450 bg-amber-400"></div>}
                                </div>
                                <div className="text-left">
                                  <p className={`text-xs font-black ${selectedServiceId === service.id ? 'text-white' : 'text-neutral-900'}`}>
                                    {service.name}
                                  </p>
                                  <p className={`text-[10px] font-semibold ${selectedServiceId === service.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {service.duration} mins de coiffe
                                  </p>
                                </div>
                              </div>
                              <span className={`text-xs font-bold font-mono ${selectedServiceId === service.id ? 'text-neutral-200' : 'text-[#111]'}`}>
                                {formatFCFA(service.price)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Summary alert info before joining */}
                      <div className="rounded-2xl bg-neutral-50 p-4 space-y-1.5 text-xs font-semibold text-neutral-500 border border-neutral-200">
                        <div className="flex justify-between">
                          <span>Temps d'attente estimé :</span>
                          <span className="text-neutral-900 font-black">
                            ~{getEstimatedWaitTime(queue, selectedBarberId || '', selectedBarber?.avgTime || 20)} mins
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Clients devant vous :</span>
                          <span className="text-neutral-900 font-black">
                            {queue.filter((q) => q.barberId === selectedBarberId && (q.status === 'waiting' || q.status === 'active')).length}
                          </span>
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !clientName.trim()}
                        className="w-full bg-neutral-900 hover:bg-neutral-950 disabled:bg-neutral-205 disabled:text-neutral-400 text-white font-bold rounded-2xl py-3.5 text-xs uppercase tracking-wider transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        ) : (
                          <>
                            Rejoindre la file d'attente
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

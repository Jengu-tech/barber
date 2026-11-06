/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight, BookOpen, Scissors, DollarSign, Smartphone, QrCode } from 'lucide-react';

export default function HelpGuide() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'flow' | 'tips'>('flow');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold px-3.5 py-2.5 rounded-full shadow-xl flex items-center gap-1.5 transition-all text-xs z-50 animate-pulse border border-amber-400 group cursor-pointer"
        title="Guide d'utilisation"
      >
        <BookOpen className="w-4 h-4 text-neutral-950 group-hover:scale-110 transition-transform" />
        <span>Guide d'utilisation</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-80 bg-neutral-900 light:bg-white border border-neutral-800 light:border-neutral-200 rounded-2xl shadow-2xl p-4 z-50 text-neutral-200 light:text-neutral-850 transition-all duration-200">
      <div className="flex justify-between items-center pb-2 border-b border-neutral-800 light:border-neutral-200 mb-3">
        <span className="flex items-center gap-2 text-xs font-black text-neutral-100 light:text-neutral-950 uppercase tracking-wider font-mono">
          <BookOpen className="w-4 h-4 text-amber-500" />
          Comment ça marche ?
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-neutral-500 hover:text-neutral-200 light:hover:text-neutral-950 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-neutral-950 light:bg-neutral-100 rounded-xl mb-3 border border-neutral-850 light:border-neutral-200">
        <button
          onClick={() => setActiveTab('flow')}
          className={`flex-1 text-[10px] py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer ${
            activeTab === 'flow'
              ? 'bg-neutral-800 light:bg-white text-white light:text-neutral-950 shadow-sm border border-neutral-700/40 light:border-neutral-300'
              : 'text-neutral-500 hover:text-neutral-300 light:hover:text-neutral-600'
          }`}
        >
          ⚙️ Cycle de Vie
        </button>
        <button
          onClick={() => setActiveTab('tips')}
          className={`flex-1 text-[10px] py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer ${
            activeTab === 'tips'
              ? 'bg-neutral-800 light:bg-white text-white light:text-neutral-950 shadow-sm border border-neutral-700/40 light:border-neutral-300'
              : 'text-neutral-500 hover:text-neutral-300 light:hover:text-neutral-600'
          }`}
        >
          💡 Astuces Pro
        </button>
      </div>

      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
        {activeTab === 'flow' ? (
          <div className="space-y-3.5">
            {/* Step 1 */}
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 font-bold text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-extrabold text-neutral-100 light:text-neutral-950 uppercase tracking-tight flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-neutral-400" /> Page Boutique
                </h4>
                <p className="text-[10px] text-neutral-400 light:text-neutral-500 leading-relaxed">
                  Le client scanne le QR code, remplit son nom/tél et choisit son service pour rejoindre la file d'attente digitale en temps réel.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 font-bold text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-extrabold text-neutral-100 light:text-neutral-950 uppercase tracking-tight flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-neutral-400" /> Appeler le client
                </h4>
                <p className="text-[10px] text-neutral-400 light:text-neutral-500 leading-relaxed">
                  Sur votre Dashboard Barbier, cliquez sur le bouton <strong className="text-emerald-400">Play (Appeler)</strong> pour lancer la prestation. Le chronomètre se lance alors en temps réel !
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 font-bold text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-extrabold text-neutral-100 light:text-neutral-950 uppercase tracking-tight flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-neutral-400" /> Prestation Terminée
                </h4>
                <p className="text-[10px] text-neutral-400 light:text-neutral-500 leading-relaxed">
                  Une fois fini, cliquez sur <strong className="text-green-400">Terminer (Check)</strong>. La prestation est encaissée, archivée dans les rapports de revenus de la section <strong>Compta</strong>.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 text-[10px] text-neutral-400 light:text-neutral-500 leading-relaxed">
            <div className="p-2.2 bg-neutral-950 light:bg-neutral-50 rounded-xl border border-neutral-850 light:border-neutral-200/80">
              <span className="font-extrabold text-neutral-200 light:text-neutral-900 block mb-0.5 uppercase tracking-tight">📱 Mode Hors-Ligne Pro</span>
              Si la connexion Internet est perdue, Barber_Pro continue de fonctionner de manière complètement autonome en stockant vos données localement.
            </div>
            
            <div className="p-2.2 bg-neutral-950 light:bg-neutral-50 rounded-xl border border-neutral-850 light:border-neutral-200/80">
              <span className="font-extrabold text-neutral-200 light:text-neutral-900 block mb-0.5 uppercase tracking-tight">🔗 Lien Direct Client</span>
              Dans l'onglet Barbier, vous trouverez le bouton de partage ou le QR Code à placer sur vos miroirs ou sur vos réseaux sociaux pour que vos clients réservent leur ticket virtuellement !
            </div>

            <div className="p-2.2 bg-neutral-950 light:bg-neutral-50 rounded-xl border border-neutral-850 light:border-neutral-200/80">
              <span className="font-extrabold text-neutral-200 light:text-neutral-900 block mb-0.5 uppercase tracking-tight">📈 Analyse en Direct</span>
              L'onglet <strong>Compta</strong> met automatiquement à jour vos revenus journaliers, la répartition des tâches par barbier, et vos services les plus populaires.
            </div>
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-neutral-800 light:border-neutral-200 flex justify-between items-center text-[9px] text-neutral-500">
        <span>Barber_Pro — Mode Barbier</span>
        <span className="font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-mono">V1.2.0</span>
      </div>
    </div>
  );
}

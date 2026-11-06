/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useBarber } from '../context/BarberContext';
import { formatFCFA } from '../utils';
import { TrendingUp, Users, DollarSign, Download, Calendar, ArrowUpRight, BarChart2, ShieldAlert, Award, FileSpreadsheet, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export default function AccountingView() {
  const { transactions, queue, getWeeklyRevenues, clearAllData } = useBarber();
  const [activeTab, setActiveTab] = useState<'jour' | 'semaine' | 'mois'>('jour');

  // Anchor date is 2026-05-22
  const anchorDateStr = '2026-05-22';

  // Compute stats for "Today" (based on anchor date)
  const todayTransactions = transactions.filter((tx) => {
    return tx.timestamp.startsWith(anchorDateStr);
  });

  const todayRevenue = todayTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  const todayClientsCount = todayTransactions.length;
  const averageTicket = todayClientsCount > 0 ? Math.round(todayRevenue / todayClientsCount) : 0;

  // Let's compute stats for "Week"
  const weeklyRevenue = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const weeklyClientsCount = transactions.length;
  const weeklyAverageTicket = weeklyClientsCount > 0 ? Math.round(weeklyRevenue / weeklyClientsCount) : 0;

  // Determine which stats to show based on period tab
  const getPeriodStats = () => {
    switch (activeTab) {
      case 'jour':
        return {
          revenue: todayRevenue,
          clientsCount: todayClientsCount,
          avgTicket: averageTicket,
          subLabel: 'vs hier',
          trend: '↑ +12% ' + (todayRevenue > 40000 ? 'excellent' : 'moyen'),
          subClientLabel: 'sur 16 en file',
        };
      case 'semaine':
      case 'mois':
        return {
          revenue: weeklyRevenue,
          clientsCount: weeklyClientsCount,
          avgTicket: weeklyAverageTicket,
          subLabel: 'vs semaine passée',
          trend: '↑ +18% forte affluence',
          subClientLabel: 'total servis',
        };
    }
  };

  const periodStats = getPeriodStats();

  // Draw weekly chart auto-scaling
  const weeklyData = getWeeklyRevenues();
  const maxWeeklyAmount = Math.max(...weeklyData.map((d) => d.amount), 1);

  // File download exporters
  const handleExportCSV = () => {
    // Generate headers
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID Transaction,Client,Barbier,Service,Montant (FCFA),Date & Heure,Statut\r\n';
    
    // Rows
    transactions.forEach((tx) => {
      const row = [
        tx.id,
        tx.clientName,
        tx.barberName,
        tx.serviceName,
        tx.amount,
        new Date(tx.timestamp).toLocaleString('fr-FR'),
        'Payé',
      ].join(',');
      csvContent += row + '\r\n';
    });

    // Create anchor trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BarberQ_Rapport_Transactions_${anchorDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const reportData = {
      salon: "King's Barbershop",
      exportDate: new Date().toISOString(),
      metrics: {
        todayRevenue,
        todayClientsCount,
        averageTicket,
        weeklyTotalRevenue: weeklyRevenue,
      },
      transactions: transactions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `BarberQ_Rapport_Complet_${anchorDateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      {/* Redundant standard navigation inside billing mock */}
      <div className="bg-neutral-950 p-4 border-b border-neutral-850 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Comptabilité</h3>
          <p className="text-[11px] text-neutral-400">Moussa Keïta · King's</p>
        </div>

        {/* Quick wipe control */}
        <button
          onClick={() => {
            if (confirm('Voulez-vous réinitialiser toutes les données de test ? (Les transactions de démonstration seront ré-insérées)')) {
              clearAllData();
            }
          }}
          className="text-[10px] text-neutral-500 hover:text-red-400 border border-neutral-850 hover:border-red-950/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          Réinitialiser
        </button>
      </div>

      {/* Period Selector tabs */}
      <div className="flex bg-neutral-900 border-b border-neutral-850 px-4">
        <button
          onClick={() => setActiveTab('jour')}
          className={`flex-1 text-center py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'jour'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Jour
        </button>
        <button
          onClick={() => setActiveTab('semaine')}
          className={`flex-1 text-center py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'semaine'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Semaine
        </button>
        <button
          onClick={() => setActiveTab('mois')}
          className={`flex-1 text-center py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'mois'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Mois
        </button>
      </div>

      {/* Grid statistics elements */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3.5">
          {/* Main big revenue banner card */}
          <div className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none mb-1.5">
              Revenus {activeTab === 'jour' ? "aujourd'hui" : activeTab === 'semaine' ? 'cette semaine' : 'ce mois'}
            </p>
            <h2 className="text-3xl font-extrabold font-mono text-white tracking-tight leading-none my-1">
              {formatFCFA(periodStats.revenue)}
            </h2>
            <p className="text-[11px] text-green-400 font-semibold flex items-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5" />
              {periodStats.trend}
            </p>
          </div>

          {/* Average client served cards */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none mb-2">
              Clients servis
            </p>
            <h3 className="text-2xl font-bold font-mono text-white leading-none">
              {periodStats.clientsCount}
            </h3>
            <p className="text-[10px] text-neutral-500 font-medium mt-2">
              {periodStats.subClientLabel}
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none mb-2">
              Moy. par client
            </p>
            <h3 className="text-2xl font-bold font-mono text-white leading-none">
              {periodStats.avgTicket.toLocaleString('fr-FR')}
            </h3>
            <p className="text-[10px] text-neutral-500 font-medium mt-2">
              FCFA par ticket
            </p>
          </div>

          {/* Weekly Interactive Bar chart */}
          <div className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-0">
                Revenus de la semaine
              </p>
              <span className="text-[10px] text-green-400 font-bold bg-green-950/20 px-2 py-0.5 rounded border border-green-900/30">
                Période Actuelle
              </span>
            </div>

            {/* Bars row */}
            <div className="flex items-end justify-between h-24 pt-2 pb-0 px-2 border-b border-neutral-800">
              {weeklyData.map((d, index) => {
                const pct = (d.amount / maxWeeklyAmount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute bg-neutral-950 text-white text-[9px] font-mono leading-none rounded p-1 -translate-y-8 transition-opacity z-10 border border-neutral-850 shadow-lg select-none">
                      {formatFCFA(d.amount)}
                    </div>

                    <div className="w-full px-1 max-w-[15px] h-full flex items-end">
                      <div
                        className={`w-full rounded-t-md transition-all duration-700 ${
                          d.isToday
                            ? 'bg-green-500 shadow-md shadow-green-500/20'
                            : pct > 80
                            ? 'bg-neutral-150'
                            : 'bg-neutral-700'
                        }`}
                        style={{ height: `${Math.max(4, pct)}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] text-neutral-500 font-mono">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Latest Transactions Log list */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest px-1">
            Dernières transactions
          </p>

          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {todayTransactions.length > 0 ? (
              todayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-850/80 rounded-xl hover:border-neutral-800 transition-colors"
                >
                  <div className="w-8.5 h-8.5 rounded-full bg-neutral-850 flex items-center justify-center font-bold text-xs text-neutral-300">
                    {tx.clientName.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {tx.clientName}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {tx.serviceName} · <span className="text-neutral-500">{tx.barberName}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-white block">
                      {formatFCFA(tx.amount)}
                    </span>
                    <span className="inline-block text-[10px] font-semibold bg-green-500/10 text-green-400 hover:bg-green-500/15 border border-green-500/15 rounded-md px-1.5 py-0.5 mt-1 font-mono leading-none">
                      ✓ Payé
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-neutral-500 text-xs bg-neutral-900/40 border border-dashed border-neutral-850 rounded-xl">
                Aucun encaissement validé aujourd'hui
              </div>
            )}
          </div>
        </div>

        {/* Export action module widgets */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-white">Exporter mes données</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleExportJSON}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 hover:border-neutral-700 transition-all text-center group active:scale-[0.98]"
            >
              <FileText className="w-5 h-5 text-neutral-400 group-hover:text-white mb-2" />
              <span className="text-xs font-semibold text-white block">Rapport PDF</span>
              <span className="text-[9px] text-neutral-500 mt-0.5 block">Format JSON structuré</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 hover:border-neutral-700 transition-all text-center group active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-5 h-5 text-neutral-400 group-hover:text-white mb-2" />
              <span className="text-xs font-semibold text-white block">Feuille Excel</span>
              <span className="text-[9px] text-neutral-500 mt-0.5 block">Toutes les transactions CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

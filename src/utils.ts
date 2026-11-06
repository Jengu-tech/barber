/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Barber, Service, QueueItem, Transaction } from './types';

export function formatFCFA(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('XOF', 'FCFA');
}

/**
 * Calculates estimated waiting time for a new client joining a barber's queue
 */
export function getEstimatedWaitTime(
  queue: QueueItem[],
  barberId: string,
  barberAvgTime: number
): number {
  // Count how many people are 'waiting' or 'active' for this barber
  const activeAndWaiting = queue.filter(
    (item) => item.barberId === barberId && (item.status === 'waiting' || item.status === 'active')
  );
  
  // If no one is active or waiting, wait time is 0
  if (activeAndWaiting.length === 0) return 0;
  
  // Wait time is based on how many are in front, approx avgTime per person
  return activeAndWaiting.length * barberAvgTime;
}

export const INITIAL_BARBERS: Barber[] = [
  {
    id: 'moussa',
    name: 'Moussa Keïta',
    specialties: ['Dégradé', 'Barbe', 'Twist'],
    initials: 'MK',
    status: 'online',
    avgTime: 25,
  },
  {
    id: 'abdoulaye',
    name: 'Abdoulaye Ba',
    specialties: ['Coupe classique', 'Rasage'],
    initials: 'AB',
    status: 'online',
    avgTime: 20,
  },
  {
    id: 'omar',
    name: 'Omar Sow',
    specialties: ['Afro', 'Dreadlocks', 'Coloration'],
    initials: 'OS',
    status: 'online',
    avgTime: 35,
  },
];

export const INITIAL_SERVICES: Service[] = [
  { id: 'coupe-simple', name: 'Coupe classique', price: 2500, duration: 20, category: 'Coupes' },
  { id: 'degrade-barbe', name: 'Dégradé + barbe', price: 4000, duration: 30, category: 'Coupes' },
  { id: 'degrade-twist', name: 'Dégradé + twist', price: 5000, duration: 35, category: 'Coupes' },
  { id: 'afro-design', name: 'Afro soufflé + Motif', price: 4500, duration: 30, category: 'Coupes' },
  { id: 'taille-barbe', name: 'Taille barbe classique', price: 1500, duration: 20, category: 'Barbe' },
  { id: 'rasage-complet', name: 'Rasage complet traditionnel', price: 2000, duration: 25, category: 'Barbe' },
  { id: 'shampoing-soin', name: 'Masque et soin complet', price: 3000, duration: 15, category: 'Soins' },
  { id: 'dreadlocks', name: 'Départ / Entretien Locks', price: 8000, duration: 60, category: 'Soins' },
];

/**
 * Seeds initial demo transaction data to make the charts beautiful upon first load
 * Date starts from 2026-05-22T00:24:55Z (Friday)
 */
export function getSeededData() {
  const now = new Date('2026-05-22T00:00:00Z');
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Generate transactions for previous days of the week
  const transactions: Transaction[] = [];

  // Monday (Lun) - Seed ~30,000 FCFA
  const monDate = new Date(now.getTime() - 4 * dayMs);
  transactions.push(
    { id: 't-mon-1', clientName: 'Sékou Condé', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + barbe', amount: 4000, timestamp: new Date(monDate.setHours(9, 15)).toISOString(), status: 'paid' },
    { id: 't-mon-2', clientName: 'Mamadou Touré', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(monDate.setHours(10, 30)).toISOString(), status: 'paid' },
    { id: 't-mon-3', clientName: 'Youssouf S.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Départ / Entretien Locks', amount: 8000, timestamp: new Date(monDate.setHours(12, 0)).toISOString(), status: 'paid' },
    { id: 't-mon-4', clientName: 'Alpha Oumar', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + twist', amount: 5000, timestamp: new Date(monDate.setHours(14, 15)).toISOString(), status: 'paid' },
    { id: 't-mon-5', clientName: 'Ibrahim K.', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Masque et soin complet', amount: 3000, timestamp: new Date(monDate.setHours(16, 45)).toISOString(), status: 'paid' },
    { id: 't-mon-6', clientName: 'Chérif Diallo', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(monDate.setHours(18, 30)).toISOString(), status: 'paid' },
    { id: 't-mon-7', clientName: 'Modibo C.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Afro soufflé + Motif', amount: 4500, timestamp: new Date(monDate.setHours(19, 10)).toISOString(), status: 'paid' }
  );

  // Tuesday (Mar) - Seed ~45,000 FCFA
  const tueDate = new Date(now.getTime() - 3 * dayMs);
  transactions.push(
    { id: 't-tue-1', clientName: 'Ousmane Sylla', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Départ / Entretien Locks', amount: 8000, timestamp: new Date(tueDate.setHours(9, 30)).toISOString(), status: 'paid' },
    { id: 't-tue-2', clientName: 'Naby Soumah', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + twist', amount: 5000, timestamp: new Date(tueDate.setHours(10, 45)).toISOString(), status: 'paid' },
    { id: 't-tue-3', clientName: 'Samba G.', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(tueDate.setHours(11, 30)).toISOString(), status: 'paid' },
    { id: 't-tue-4', clientName: 'Balla Fofana', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + barbe', amount: 4000, timestamp: new Date(tueDate.setHours(13, 15)).toISOString(), status: 'paid' },
    { id: 't-tue-5', clientName: 'Demba Diallo', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Afro soufflé + Motif', amount: 4500, timestamp: new Date(tueDate.setHours(14, 40)).toISOString(), status: 'paid' },
    { id: 't-tue-6', clientName: 'Lamine Bangoura', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Masque et soin complet', amount: 3000, timestamp: new Date(tueDate.setHours(15, 55)).toISOString(), status: 'paid' },
    { id: 't-tue-7', clientName: 'Karim B.', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + twist', amount: 5000, timestamp: new Date(tueDate.setHours(17, 20)).toISOString(), status: 'paid' },
    { id: 't-tue-8', clientName: 'Sékouba O.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Départ / Entretien Locks', amount: 8000, timestamp: new Date(tueDate.setHours(18, 40)).toISOString(), status: 'paid' },
    { id: 't-tue-9', clientName: 'Alassane P.', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(tueDate.setHours(19, 30)).toISOString(), status: 'paid' }
  );

  // Wednesday (Mer) - Seed ~25,000 FCFA
  const wedDate = new Date(now.getTime() - 2 * dayMs);
  transactions.push(
    { id: 't-wed-1', clientName: 'Tidiane Diallo', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(wedDate.setHours(10, 0)).toISOString(), status: 'paid' },
    { id: 't-wed-2', clientName: 'Amadou Camara', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Masque et soin complet', amount: 3000, timestamp: new Date(wedDate.setHours(11, 15)).toISOString(), status: 'paid' },
    { id: 't-wed-3', clientName: 'Barry S.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Afro soufflé + Motif', amount: 4500, timestamp: new Date(wedDate.setHours(13, 0)).toISOString(), status: 'paid' },
    { id: 't-wed-4', clientName: 'Ismaël Ciss', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + barbe', amount: 4000, timestamp: new Date(wedDate.setHours(15, 30)).toISOString(), status: 'paid' },
    { id: 't-wed-5', clientName: 'Fousseni D.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Dégradé + twist', amount: 5000, timestamp: new Date(wedDate.setHours(17, 10)).toISOString(), status: 'paid' },
    { id: 't-wed-6', clientName: 'Cheick Tidiane', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(wedDate.setHours(18, 20)).toISOString(), status: 'paid' },
    { id: 't-wed-7', clientName: 'Sidiki K.', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Masque et soin complet', amount: 3000, timestamp: new Date(wedDate.setHours(19, 45)).toISOString(), status: 'paid' }
  );

  // Thursday (Jeu) - Seed ~50,000 FCFA
  const thuDate = new Date(now.getTime() - dayMs);
  transactions.push(
    { id: 't-thu-1', clientName: 'Karamoko B.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Départ / Entretien Locks', amount: 8000, timestamp: new Date(thuDate.setHours(9, 10)).toISOString(), status: 'paid' },
    { id: 't-thu-2', clientName: 'Laye Mara', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + twist', amount: 5000, timestamp: new Date(thuDate.setHours(10, 20)).toISOString(), status: 'paid' },
    { id: 't-thu-3', clientName: 'Abdoulaye S.', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(thuDate.setHours(11, 40)).toISOString(), status: 'paid' },
    { id: 't-thu-4', clientName: 'Sidiki Diabaté', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + twist', amount: 5000, timestamp: new Date(thuDate.setHours(13, 0)).toISOString(), status: 'paid' },
    { id: 't-thu-5', clientName: 'Ibrahima C.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Afro soufflé + Motif', amount: 4500, timestamp: new Date(thuDate.setHours(14, 30)).toISOString(), status: 'paid' },
    { id: 't-thu-6', clientName: 'Zoumana K.', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Masque et soin complet', amount: 3000, timestamp: new Date(thuDate.setHours(15, 50)).toISOString(), status: 'paid' },
    { id: 't-thu-7', clientName: 'Manso F.', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + barbe', amount: 4000, timestamp: new Date(thuDate.setHours(16, 45)).toISOString(), status: 'paid' },
    { id: 't-thu-8', clientName: 'Djibril S.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Départ / Entretien Locks', amount: 8000, timestamp: new Date(thuDate.setHours(18, 0)).toISOString(), status: 'paid' },
    { id: 't-thu-9', clientName: 'Bocar S.', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé +twist', amount: 5000, timestamp: new Date(thuDate.setHours(18, 55)).toISOString(), status: 'paid' },
    { id: 't-thu-10', clientName: 'Lancine T.', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(thuDate.setHours(19, 40)).toISOString(), status: 'paid' }
  );

  // Friday (Ven - Today) - Seed ~47,500 FCFA as in mockup, but matching earlier times
  const friDate = new Date(now);
  transactions.push(
    { id: 't-fri-1', clientName: 'Amadou M.', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + twist', amount: 5000, timestamp: new Date(friDate.setHours(13, 10)).toISOString(), status: 'paid' },
    { id: 't-fri-2', clientName: 'Ibrahima Sow', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(friDate.setHours(13, 55)).toISOString(), status: 'paid' },
    { id: 't-fri-3', clientName: 'Diallo Thierno', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + barbe', amount: 4000, timestamp: new Date(friDate.setHours(14, 32)).toISOString(), status: 'paid' },
    { id: 't-fri-4', clientName: 'Daouda S.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Départ / Entretien Locks', amount: 8000, timestamp: new Date(friDate.setHours(9, 45)).toISOString(), status: 'paid' },
    { id: 't-fri-5', clientName: 'Fodé Sylla', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + barbe', amount: 4000, timestamp: new Date(friDate.setHours(10, 15)).toISOString(), status: 'paid' },
    { id: 't-fri-6', clientName: 'Bakary K.', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(friDate.setHours(10, 50)).toISOString(), status: 'paid' },
    { id: 't-fri-7', clientName: 'Saliou S.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Afro soufflé + Motif', amount: 4500, timestamp: new Date(friDate.setHours(11, 20)).toISOString(), status: 'paid' },
    { id: 't-fri-8', clientName: 'Aboubacar S.', barberId: 'moussa', barberName: 'Moussa Keïta', serviceName: 'Dégradé + twist', amount: 5000, timestamp: new Date(friDate.setHours(12, 0)).toISOString(), status: 'paid' },
    { id: 't-fri-9', clientName: 'Modou L.', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Coupe classique', amount: 2500, timestamp: new Date(friDate.setHours(12, 40)).toISOString(), status: 'paid' },
    { id: 't-fri-10', clientName: 'Pathé B.', barberId: 'omar', barberName: 'Omar Sow', serviceName: 'Départ / Entretien Locks', amount: 8000, timestamp: new Date(friDate.setHours(14, 10)).toISOString(), status: 'paid' },
    { id: 't-fri-11', clientName: 'Ibrahima D.', barberId: 'abdoulaye', barberName: 'Abdoulaye Ba', serviceName: 'Masque et soin complet', amount: 3000, timestamp: new Date(friDate.setHours(14, 55)).toISOString(), status: 'paid' }
  );

  // Let's seed initial wait queue for today!
  const queue: QueueItem[] = [
    {
      id: 'q-fri-1',
      clientName: 'Ibrahima',
      barberId: 'moussa',
      serviceId: 'degrade-barbe',
      serviceName: 'Dégradé + barbe',
      price: 4000,
      joinedAt: new Date(friDate.setHours(15, 0)).toISOString(),
      status: 'waiting',
    },
    {
      id: 'q-fri-2',
      clientName: 'Amadou M.',
      barberId: 'moussa',
      serviceId: 'degrade-twist',
      serviceName: 'Dégradé + twist',
      price: 5000,
      joinedAt: new Date(friDate.setHours(15, 5)).toISOString(),
      status: 'waiting',
    },
    {
      id: 'q-fri-3',
      clientName: 'Seydou F.',
      barberId: 'moussa',
      serviceId: 'coupe-simple',
      serviceName: 'Rasage classique',
      price: 2500,
      joinedAt: new Date(friDate.setHours(15, 12)).toISOString(),
      status: 'waiting',
    },
    {
      id: 'q-fri-4',
      clientName: 'Alpha Condé',
      barberId: 'abdoulaye',
      serviceId: 'coupe-simple',
      serviceName: 'Coupe classique',
      price: 2500,
      joinedAt: new Date(friDate.setHours(15, 8)).toISOString(),
      status: 'active',
      startedAt: new Date(friDate.setHours(15, 10)).toISOString(),
    },
    {
      id: 'q-fri-5',
      clientName: 'Sékouba Mara',
      barberId: 'omar',
      serviceId: 'dreadlocks',
      serviceName: 'Départ / Entretien Locks',
      price: 8000,
      joinedAt: new Date(friDate.setHours(14, 50)).toISOString(),
      status: 'waiting',
    }
  ];

  return { transactions, queue };
}

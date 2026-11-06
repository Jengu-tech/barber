/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Barber {
  id: string;
  name: string;
  specialties: string[];
  initials: string;
  status: 'online' | 'offline';
  avgTime: number; // in minutes per client
}

export interface Service {
  id: string;
  name: string;
  price: number; // FCFA
  duration: number; // minutes
  category?: string; // Coupes / Barbe / Soins
}

export interface QueueItem {
  id: string;
  clientName: string;
  phone?: string; // Client phone number
  barberId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  joinedAt: string; // ISO date string
  status: 'waiting' | 'active' | 'completed' | 'cancelled' | 'skipped';
  startedAt?: string; // when moved to "active"
  completedAt?: string; // when completed
}

export interface Transaction {
  id: string;
  clientName: string;
  barberId: string;
  barberName: string;
  serviceName: string;
  amount: number; // in FCFA
  timestamp: string; // ISO date string
  status: 'paid';
}

export interface WeeklyChartData {
  day: string; // e.g. "Lun", "Mar"
  amount: number;
  isToday?: boolean;
}

export interface BarberState {
  barbers: Barber[];
  services: Service[];
  queue: QueueItem[];
  transactions: Transaction[];
  currentClientId?: string; // ID of QueueItem currently with active status, if any, per barber code or general
}

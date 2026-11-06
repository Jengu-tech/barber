/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueueItem } from './types';

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

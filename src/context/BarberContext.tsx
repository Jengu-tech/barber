/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Barber, Service, QueueItem, Transaction, WeeklyChartData } from '../types';
import { INITIAL_BARBERS, INITIAL_SERVICES, getSeededData, getEstimatedWaitTime } from '../utils';
import {
  supabase,
  dbSaveShopName,
  dbSaveShopSetting,
  dbUpsertQueueItem,
  dbDeleteQueueItem,
  dbInsertTransaction,
  dbSaveBarber,
  dbDeleteBarber,
  dbSaveService,
  dbDeleteService,
  dbResetAll,
  dbFetchAll
} from '../lib/supabase';

interface BarberContextType {
  shopName: string;
  shopAddress: string;
  shopCoverUrl: string;
  shopLogoUrl: string;
  shopIsOpen: boolean;
  barbers: Barber[];
  services: Service[];
  queue: QueueItem[];
  transactions: Transaction[];
  currentRole: 'client' | 'barber' | 'admin';
  activeBarberId: string; // the barbier currently using the tablet
  clientActiveTicketId: string | null; // stores the joined queue item ID for the current browser session
  
  // Controls
  setShopName: (name: string) => void;
  setShopAddress: (address: string) => void;
  setShopCoverUrl: (url: string) => void;
  setShopLogoUrl: (url: string) => void;
  setShopIsOpen: (open: boolean) => void;
  setCurrentRole: (role: 'client' | 'barber' | 'admin') => void;
  setActiveBarberId: (id: string) => void;
  setClientActiveTicketId: (id: string | null) => void;
  
  // Actions
  joinQueue: (clientName: string, phone: string, barberId: string, serviceId: string) => QueueItem;
  leaveQueue: (id: string) => void;
  startClientSession: (queueItemId: string) => void;
  completeClientSession: (queueItemId: string) => void;
  skipClientSession: (queueItemId: string) => void;
  cancelClientSession: (queueItemId: string) => void;
  toggleBarberStatus: (barberId: string) => void;
  
  // Custom Settings modifiers
  addBarberCount: (name: string, specialties: string[], avgTime: number) => Barber;
  removeBarberCount: (id: string) => void;
  addServiceCount: (name: string, price: number, duration: number, category?: string) => Service;
  removeServiceCount: (id: string) => void;
  
  // Simulator helpers
  addRandomClient: () => void;
  clearAllData: () => void;
  getWeeklyRevenues: () => WeeklyChartData[];
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

export function BarberProvider({ children }: { children: ReactNode }) {
  const [shopName, setShopNameState] = useState<string>(() => {
    return localStorage.getItem('barberq_shop_name') || "Salon Barber_Pro";
  });

  const [shopAddress, setShopAddressState] = useState<string>(() => {
    return localStorage.getItem('barberq_shop_address') || "Avenue Blaise Diagne, Dakar, Sénégal";
  });

  const [shopCoverUrl, setShopCoverUrlState] = useState<string>(() => {
    return localStorage.getItem('barberq_shop_cover') || "";
  });

  const [shopLogoUrl, setShopLogoUrlState] = useState<string>(() => {
    return localStorage.getItem('barberq_shop_avatar') || "";
  });

  const [shopIsOpen, setShopIsOpenState] = useState<boolean>(() => {
    return (localStorage.getItem('barberq_shop_is_open') || "true") === "true";
  });

  const [barbers, setBarbers] = useState<Barber[]>(() => {
    const saved = localStorage.getItem('barberq_barbers');
    return saved ? JSON.parse(saved) : INITIAL_BARBERS;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('barberq_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem('barberq_queue');
    if (saved) return JSON.parse(saved);
    const seeded = getSeededData();
    return seeded.queue;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('barberq_transactions');
    if (saved) return JSON.parse(saved);
    const seeded = getSeededData();
    return seeded.transactions;
  });

  // UI state
  const [currentRole, setCurrentRole] = useState<'client' | 'barber' | 'admin'>('client');
  const [activeBarberId, setActiveBarberId] = useState<string>('moussa');
  const [clientActiveTicketId, setClientActiveTicketId] = useState<string | null>(() => {
    return localStorage.getItem('barberq_active_ticket_id');
  });

  // Sync back to local storage and database
  const setShopName = (name: string) => {
    setShopNameState(name);
    localStorage.setItem('barberq_shop_name', name);
    dbSaveShopName(name);
  };

  const setShopAddress = (address: string) => {
    setShopAddressState(address);
    localStorage.setItem('barberq_shop_address', address);
    dbSaveShopSetting('shop_address', address);
  };

  const setShopCoverUrl = (url: string) => {
    setShopCoverUrlState(url);
    localStorage.setItem('barberq_shop_cover', url);
    dbSaveShopSetting('shop_cover', url);
  };

  const setShopLogoUrl = (url: string) => {
    setShopLogoUrlState(url);
    localStorage.setItem('barberq_shop_avatar', url);
    dbSaveShopSetting('shop_avatar', url);
  };

  const setShopIsOpen = (open: boolean) => {
    setShopIsOpenState(open);
    localStorage.setItem('barberq_shop_is_open', open ? "true" : "false");
    dbSaveShopSetting('shop_is_open', open ? "true" : "false");
  };

  // Synchronize initial data from Supabase if configured
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        const data = await dbFetchAll();
        if (data) {
          if (data.shopName) setShopNameState(data.shopName);
          // @ts-ignore
          if (data.shopAddress) setShopAddressState(data.shopAddress);
          // @ts-ignore
          if (data.shopCover !== undefined) setShopCoverUrlState(data.shopCover || "");
          // @ts-ignore
          if (data.shopAvatar !== undefined) setShopLogoUrlState(data.shopAvatar || "");
          // @ts-ignore
          if (data.shopIsOpen !== undefined) setShopIsOpenState(data.shopIsOpen);
          if (data.barbers) setBarbers(data.barbers);
          if (data.services) setServices(data.services);
          if (data.queue) setQueue(data.queue);
          if (data.transactions) setTransactions(data.transactions);
        }
      } catch (err) {
        console.error("Failed loading initial Supabase data:", err);
      }
    }
    loadSupabaseData();
  }, []);

  // Real-time Postgres changes listeners for immediate cross-device dynamic sync
  useEffect(() => {
    if (!supabase) return;

    const queueChannel = supabase
      .channel('queue_items_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_items' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newItem: QueueItem = {
              id: payload.new.id,
              clientName: payload.new.client_name,
              phone: payload.new.phone || undefined,
              barberId: payload.new.barber_id,
              serviceId: payload.new.service_id,
              serviceName: payload.new.service_name,
              price: Number(payload.new.price),
              status: payload.new.status,
              joinedAt: payload.new.joined_at,
              startedAt: payload.new.started_at || undefined,
              completedAt: payload.new.completed_at || undefined
            };
            setQueue((prev) => {
              const exists = prev.some((item) => item.id === newItem.id);
              if (exists) {
                return prev.map((item) => (item.id === newItem.id ? newItem : item));
              }
              return [...prev, newItem];
            });
          } else if (payload.eventType === 'DELETE') {
            setQueue((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const barbersChannel = supabase
      .channel('barbers_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barbers' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newBarber: Barber = {
              id: payload.new.id,
              name: payload.new.name,
              initials: payload.new.initials,
              specialties: payload.new.specialties,
              status: payload.new.status,
              avgTime: payload.new.avg_time
            };
            setBarbers((prev) => {
              const exists = prev.some((b) => b.id === newBarber.id);
              if (exists) {
                return prev.map((b) => (b.id === newBarber.id ? newBarber : b));
              }
              return [...prev, newBarber];
            });
          } else if (payload.eventType === 'DELETE') {
            setBarbers((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('services_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newService: Service = {
              id: payload.new.id,
              name: payload.new.name,
              price: Number(payload.new.price),
              duration: payload.new.duration
            };
            setServices((prev) => {
              const exists = prev.some((s) => s.id === newService.id);
              if (exists) {
                return prev.map((s) => (s.id === newService.id ? newService : s));
              }
              return [...prev, newService];
            });
          } else if (payload.eventType === 'DELETE') {
            setServices((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel('shop_settings_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shop_settings' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new.key === 'shop_name') {
              setShopNameState(payload.new.value);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(barbersChannel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('barberq_barbers', JSON.stringify(barbers));
  }, [barbers]);

  useEffect(() => {
    localStorage.setItem('barberq_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('barberq_queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('barberq_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (clientActiveTicketId) {
      localStorage.setItem('barberq_active_ticket_id', clientActiveTicketId);
    } else {
      localStorage.removeItem('barberq_active_ticket_id');
    }
  }, [clientActiveTicketId]);

  // Client joins the queue
  const joinQueue = (clientName: string, phone: string, barberId: string, serviceId: string): QueueItem => {
    const selectedService = services.find((s) => s.id === serviceId) || services[0];
    
    const newItem: QueueItem = {
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientName: clientName.trim() || 'Client Anonyme',
      phone: phone.trim() || undefined,
      barberId,
      serviceId,
      serviceName: selectedService.name,
      price: selectedService.price,
      joinedAt: new Date().toISOString(),
      status: 'waiting',
    };

    setQueue((prev) => [...prev, newItem]);
    dbUpsertQueueItem(newItem);
    
    // If the client registers themselves initially, set active ticket ID
    if (currentRole === 'client') {
      setClientActiveTicketId(newItem.id);
    }
    
    return newItem;
  };

  // Client decides to leave the queue
  const leaveQueue = (id: string) => {
    setQueue((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, status: 'cancelled' as const } : item
      );
      const target = updated.find(item => item.id === id);
      if (target) {
        dbUpsertQueueItem(target);
      }
      return updated;
    });
    if (clientActiveTicketId === id) {
      setClientActiveTicketId(null);
    }
  };

  // Barber starts a session for a client
  const startClientSession = (queueItemId: string) => {
    setQueue((prev) => {
      const target = prev.find((item) => item.id === queueItemId);
      if (!target) return prev;
      
      const barberId = target.barberId;
      const updated = prev.map((item) => {
        if (item.barberId === barberId && item.status === 'active') {
          const completedItem = { ...item, status: 'completed' as const, completedAt: new Date().toISOString() };
          dbUpsertQueueItem(completedItem);
          return completedItem;
        }
        if (item.id === queueItemId) {
          const activeItem = { ...item, status: 'active' as const, startedAt: new Date().toISOString() };
          dbUpsertQueueItem(activeItem);
          return activeItem;
        }
        return item;
      });
      return updated;
    });
  };

  // Barber marks service as completed (this triggers an invoice / transaction!)
  const completeClientSession = (queueItemId: string) => {
    const item = queue.find((q) => q.id === queueItemId);
    if (!item) return;

    const barberObj = barbers.find((b) => b.id === item.barberId);
    const barberName = barberObj ? barberObj.name : 'Barbier';

    const completedItem: QueueItem = {
      ...item,
      status: 'completed' as const,
      completedAt: new Date().toISOString()
    };

    // 1. Update queue item status
    setQueue((prev) =>
      prev.map((q) => (q.id === queueItemId ? completedItem : q))
    );
    dbUpsertQueueItem(completedItem);

    // 2. Add as resolved transaction for payments list!
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      clientName: item.clientName,
      barberId: item.barberId,
      barberName,
      serviceName: item.serviceName,
      amount: item.price,
      timestamp: new Date().toISOString(),
      status: 'paid',
    };

    setTransactions((prev) => [newTx, ...prev]);
    dbInsertTransaction(newTx);

    // Cleanup client local storage if this was the current browser's active ticket
    if (clientActiveTicketId === queueItemId) {
      setClientActiveTicketId(null);
    }
  };

  // Barber skips a client
  const skipClientSession = (queueItemId: string) => {
    const item = queue.find((q) => q.id === queueItemId);
    if (item) {
      const updated: QueueItem = { ...item, status: 'skipped' as const };
      setQueue((prev) => prev.map((q) => (q.id === queueItemId ? updated : q)));
      dbUpsertQueueItem(updated);
    }
    if (clientActiveTicketId === queueItemId) {
      setClientActiveTicketId(null);
    }
  };

  // Barber cancels a customer booking
  const cancelClientSession = (queueItemId: string) => {
    const item = queue.find((q) => q.id === queueItemId);
    if (item) {
      const updated: QueueItem = { ...item, status: 'cancelled' as const };
      setQueue((prev) => prev.map((q) => (q.id === queueItemId ? updated : q)));
      dbUpsertQueueItem(updated);
    }
    if (clientActiveTicketId === queueItemId) {
      setClientActiveTicketId(null);
    }
  };

  // Toggles the barber active presence status
  const toggleBarberStatus = (barberId: string) => {
    setBarbers((prev) => {
      const updated = prev.map((barber) => {
        if (barber.id === barberId) {
          const updatedBarber = { ...barber, status: barber.status === 'online' ? 'offline' : 'online' };
          dbSaveBarber(updatedBarber);
          return updatedBarber;
        }
        return barber;
      });
      return updated;
    });
  };

  // Resets all state back to initial seeding
  const clearAllData = () => {
    localStorage.removeItem('barberq_shop_name');
    localStorage.removeItem('barberq_barbers');
    localStorage.removeItem('barberq_services');
    localStorage.removeItem('barberq_queue');
    localStorage.removeItem('barberq_transactions');
    localStorage.removeItem('barberq_active_ticket_id');
    
    setShopNameState("King's Barbershop");
    setBarbers(INITIAL_BARBERS);
    setServices(INITIAL_SERVICES);
    const seeded = getSeededData();
    setQueue(seeded.queue);
    setTransactions(seeded.transactions);
    setClientActiveTicketId(null);
    dbResetAll();
  };

  // Barbier account creation / addition
  const addBarberCount = (name: string, specialties: string[], avgTime: number): Barber => {
    const splitName = name.trim().split(' ');
    const initials = splitName.length > 1 
      ? (splitName[0][0] + splitName[1][0]).toUpperCase()
      : splitName[0].substring(0, 2).toUpperCase();

    const newBarber: Barber = {
      id: `b-${Date.now()}`,
      name: name.trim(),
      specialties: specialties.filter(s => s.trim().length > 0),
      initials,
      status: 'online',
      avgTime: Number(avgTime) || 25,
    };

    setBarbers((prev) => [...prev, newBarber]);
    dbSaveBarber(newBarber);
    return newBarber;
  };

  const removeBarberCount = (id: string) => {
    setBarbers((prev) => prev.filter((b) => b.id !== id));
    dbDeleteBarber(id);
  };

  // Custom service addition
  const addServiceCount = (name: string, price: number, duration: number): Service => {
    const newService: Service = {
      id: `s-${Date.now()}`,
      name: name.trim(),
      price: Number(price) || 1000,
      duration: Number(duration) || 20,
    };

    setServices((prev) => [...prev, newService]);
    dbSaveService(newService);
    return newService;
  };

  const removeServiceCount = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    dbDeleteService(id);
  };

  // Simulation assistant: generates random check-in
  const addRandomClient = () => {
    const firstNames = ['Youssef', 'Abdoulaye', 'Sékou', 'Diallo', 'Omar', 'Kassim', 'Samba', 'Ousmane', 'Fodé', 'Naby', 'Ibrahima', 'Amara', 'Malick', 'Kader', 'Bakary'];
    const lastNames = ['Sow', 'Sacko', 'Sylla', 'Keita', 'Ba', 'Camara', 'Touré', 'Diallo', 'Fofana', 'Sano', 'Cissé', 'Kaba', 'Bangoura', 'Kourouma'];
    const rFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const rLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const clientName = `${rFirstName} ${rLastName[0]}.`;

    // Choose random active online barber
    const onlineBarbers = barbers.filter((b) => b.status === 'online');
    if (onlineBarbers.length === 0) return;
    const rBarber = onlineBarbers[Math.floor(Math.random() * onlineBarbers.length)];

    // Choose random service
    const rService = services[Math.floor(Math.random() * services.length)];

    const newItem: QueueItem = {
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientName,
      phone: '+224 622 ' + Math.floor(100000 + Math.random() * 900000),
      barberId: rBarber.id,
      serviceId: rService.id,
      serviceName: rService.name,
      price: rService.price,
      joinedAt: new Date().toISOString(),
      status: 'waiting',
    };

    setQueue((prev) => [...prev, newItem]);
    dbUpsertQueueItem(newItem);
  };

  // Aggregates transactions to draw weekly chart data
  const getWeeklyRevenues = (): WeeklyChartData[] => {
    const daysFrench = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    // Group transactions by day of the week
    const now = new Date('2026-05-22T00:24:55Z'); // Anchor date
    const dayOfWeekToday = now.getDay(); // 5 for Friday
    
    // Initialize results matching weekly graph layout (Monday to Sunday)
    // French: Lun = 1, Mar = 2, Mer = 3, Jeu = 4, Ven = 5, Sam = 6, Dim = 0
    const layout = [
      { day: 'Lun', amount: 0, order: 1 },
      { day: 'Mar', amount: 0, order: 2 },
      { day: 'Mer', amount: 0, order: 3 },
      { day: 'Jeu', amount: 0, order: 4 },
      { day: 'Ven', amount: 0, order: 5, isToday: dayOfWeekToday === 5 },
      { day: 'Sam', amount: 0, order: 6, isToday: dayOfWeekToday === 6 },
      { day: 'Dim', amount: 0, order: 7, isToday: dayOfWeekToday === 0 },
    ];

    // Filter payments in current active week
    transactions.forEach((tx) => {
      const txDate = new Date(tx.timestamp);
      const dayIndex = txDate.getDay();
      
      const target = layout.find((obj) => {
        if (dayIndex === 1 && obj.day === 'Lun') return true;
        if (dayIndex === 2 && obj.day === 'Mar') return true;
        if (dayIndex === 3 && obj.day === 'Mer') return true;
        if (dayIndex === 4 && obj.day === 'Jeu') return true;
        if (dayIndex === 5 && obj.day === 'Ven') return true;
        if (dayIndex === 6 && obj.day === 'Sam') return true;
        if (dayIndex === 0 && obj.day === 'Dim') return true;
        return false;
      });

      if (target) {
        target.amount += tx.amount;
      }
    });

    return layout;
  };

  return (
    <BarberContext.Provider
      value={{
        shopName,
        shopAddress,
        shopCoverUrl,
        shopLogoUrl,
        shopIsOpen,
        barbers,
        services,
        queue,
        transactions,
        currentRole,
        activeBarberId,
        clientActiveTicketId,
        setShopName,
        setShopAddress,
        setShopCoverUrl,
        setShopLogoUrl,
        setShopIsOpen,
        setCurrentRole,
        setActiveBarberId,
        setClientActiveTicketId,
        joinQueue,
        leaveQueue,
        startClientSession,
        completeClientSession,
        skipClientSession,
        cancelClientSession,
        toggleBarberStatus,
        addBarberCount,
        removeBarberCount,
        addServiceCount,
        removeServiceCount,
        addRandomClient,
        clearAllData,
        getWeeklyRevenues,
      }}
    >
      {children}
    </BarberContext.Provider>
  );
}

export function useBarber() {
  const context = useContext(BarberContext);
  if (context === undefined) {
    throw new Error('useBarber must be used within a BarberProvider');
  }
  return context;
}


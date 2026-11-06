-- Barber_Pro - Seed Supabase (LOT B)
-- Donnees de demonstration uniquement. Aucun seed de file d'attente.
-- Toutes les dates sont relatives a now() : jamais de date fixe.

-- -------------------------------------------------------------
-- Reglages du salon
-- -------------------------------------------------------------
insert into public.shop_settings (key, value) values
  ('shop_name', 'King''s Barbershop'),
  ('shop_address', 'Avenue Blaise Diagne, Dakar, Sénégal'),
  ('shop_cover', ''),
  ('shop_avatar', ''),
  ('shop_is_open', 'true')
on conflict (key) do update
  set value = excluded.value;

-- -------------------------------------------------------------
-- Barbiers
-- -------------------------------------------------------------
insert into public.barbers (id, name, initials, specialties, status, avg_time) values
  ('moussa', 'Moussa Keïta', 'MK', array['Dégradé', 'Barbe', 'Twist'], 'online', 25),
  ('abdoulaye', 'Abdoulaye Ba', 'AB', array['Coupe classique', 'Rasage'], 'online', 20),
  ('omar', 'Omar Sow', 'OS', array['Afro', 'Dreadlocks', 'Coloration'], 'online', 35)
on conflict (id) do update
  set name = excluded.name,
      initials = excluded.initials,
      specialties = excluded.specialties,
      status = excluded.status,
      avg_time = excluded.avg_time;

-- -------------------------------------------------------------
-- Services (prix en FCFA)
-- -------------------------------------------------------------
insert into public.services (id, name, price, duration, category) values
  ('coupe-simple', 'Coupe classique', 2500, 20, 'Coupes'),
  ('degrade-barbe', 'Dégradé + barbe', 4000, 30, 'Coupes'),
  ('degrade-twist', 'Dégradé + twist', 5000, 35, 'Coupes'),
  ('afro-design', 'Afro soufflé + Motif', 4500, 30, 'Coupes'),
  ('taille-barbe', 'Taille barbe classique', 1500, 20, 'Barbe')
on conflict (id) do update
  set name = excluded.name,
      price = excluded.price,
      duration = excluded.duration,
      category = excluded.category;

-- -------------------------------------------------------------
-- Transactions de demonstration (6, reparties sur la semaine)
-- -------------------------------------------------------------
insert into public.transactions
  (id, client_name, service_name, price, timestamp, barber_name, barber_id)
values
  ('t-seed-1', 'Sékou Condé', 'Dégradé + barbe', 4000,
   now() - interval '4 days', 'Moussa Keïta', 'moussa'),
  ('t-seed-2', 'Mamadou Touré', 'Coupe classique', 2500,
   now() - interval '3 days 2 hours', 'Abdoulaye Ba', 'abdoulaye'),
  ('t-seed-3', 'Youssouf S.', 'Dégradé + twist', 5000,
   now() - interval '2 days 4 hours', 'Omar Sow', 'omar'),
  ('t-seed-4', 'Alpha Oumar', 'Dégradé + twist', 5000,
   now() - interval '1 day 1 hour', 'Moussa Keïta', 'moussa'),
  ('t-seed-5', 'Ibrahim K.', 'Coupe classique', 2500,
   now() - interval '3 hours', 'Abdoulaye Ba', 'abdoulaye'),
  ('t-seed-6', 'Modibo C.', 'Afro soufflé + Motif', 4500,
   now() - interval '1 hour', 'Omar Sow', 'omar')
on conflict (id) do update
  set client_name = excluded.client_name,
      service_name = excluded.service_name,
      price = excluded.price,
      timestamp = excluded.timestamp,
      barber_name = excluded.barber_name,
      barber_id = excluded.barber_id;

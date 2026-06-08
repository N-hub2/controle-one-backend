-- Project: Controle One
-- File: database/seed.sql
-- Purpose: Demo data for local MVP testing
-- This file must be executed after database/schema.sql.
-- This file does not create tables.
-- This file does not drop tables.
-- This file does not reset the database.
-- Demo data only, not production data.

USE controle_one;

START TRANSACTION;

-- Demo passwords for local testing:
-- Admin123!, Client123!, Garage123!
-- Only hashed passwords are stored in the users table.
INSERT INTO users (
  user_id,
  first_name,
  last_name,
  email,
  password_hash,
  phone,
  role,
  status
) VALUES
  (
    1,
    'Admin',
    'Controle One',
    'admin@controle-one.local',
    '$2b$12$Oa/ibg7.8yQS9502tWekfObU2PK5WzfrexjRmWOjtFsCtxk0C9oFm',
    '0100000001',
    'admin',
    'active'
  ),
  (
    2,
    'Client',
    'Demo',
    'client@controle-one.local',
    '$2b$12$Q/SpUnh2Fplz88vwt2FSJOyRHuiDPE0/wDhd3YC4LbSxr2T0LnNaK',
    '0100000002',
    'client',
    'active'
  ),
  (
    3,
    'Garage',
    'Paris',
    'garage.paris@controle-one.local',
    '$2b$12$EZB7MdLxwx6ZYWjZuEUo9e5ibjsbrWBGWy3KnevYC7ZCMD4aVapue',
    '0100000003',
    'garage',
    'active'
  ),
  (
    4,
    'Garage',
    'Lyon',
    'garage.lyon@controle-one.local',
    '$2b$12$EZB7MdLxwx6ZYWjZuEUo9e5ibjsbrWBGWy3KnevYC7ZCMD4aVapue',
    '0100000004',
    'garage',
    'active'
  )
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  email = VALUES(email),
  password_hash = VALUES(password_hash),
  phone = VALUES(phone),
  role = VALUES(role),
  status = VALUES(status);

INSERT INTO garages (
  garage_id,
  manager_user_id,
  name,
  address,
  city,
  postal_code,
  phone,
  email,
  description,
  status
) VALUES
  (
    1,
    3,
    'Controle One Paris 11',
    '12 Rue Oberkampf',
    'Paris',
    '75011',
    '0140000001',
    'paris11@controle-one.local',
    'Garage partenaire situé à Paris 11.',
    'active'
  ),
  (
    2,
    3,
    'Controle One Paris 15',
    '88 Rue de la Convention',
    'Paris',
    '75015',
    '0140000002',
    'paris15@controle-one.local',
    'Centre partenaire pour les contrôles techniques à Paris 15.',
    'active'
  ),
  (
    3,
    4,
    'Controle One Lyon Centre',
    '25 Rue de la République',
    'Lyon',
    '69002',
    '0470000001',
    'lyoncentre@controle-one.local',
    'Garage partenaire situé au centre de Lyon.',
    'active'
  ),
  (
    4,
    4,
    'Controle One Lille Sud',
    '41 Rue du Faubourg des Postes',
    'Lille',
    '59000',
    '0320000001',
    'lillesud@controle-one.local',
    'Garage partenaire pour la région de Lille.',
    'active'
  )
ON DUPLICATE KEY UPDATE
  manager_user_id = VALUES(manager_user_id),
  name = VALUES(name),
  address = VALUES(address),
  city = VALUES(city),
  postal_code = VALUES(postal_code),
  phone = VALUES(phone),
  email = VALUES(email),
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO services (
  service_id,
  name,
  description,
  status
) VALUES
  (
    1,
    'Contrôle technique voiture',
    'Contrôle technique standard pour voiture particulière.',
    'active'
  ),
  (
    2,
    'Contrôle pollution',
    'Contrôle des émissions polluantes du véhicule.',
    'active'
  ),
  (
    3,
    'Contre-visite',
    'Contre-visite après un contrôle technique défavorable.',
    'active'
  ),
  (
    4,
    'Contrôle moto',
    'Contrôle technique pour deux-roues motorisés.',
    'active'
  ),
  (
    5,
    'Contrôle utilitaire',
    'Contrôle technique pour véhicule utilitaire léger.',
    'active'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO tariffs (
  tariff_id,
  garage_id,
  service_id,
  price,
  currency,
  status
) VALUES
  (1, 1, 1, 78.00, 'EUR', 'active'),
  (2, 1, 2, 45.00, 'EUR', 'active'),
  (3, 1, 3, 35.00, 'EUR', 'active'),
  (4, 1, 4, 65.00, 'EUR', 'active'),
  (5, 1, 5, 95.00, 'EUR', 'active'),
  (6, 2, 1, 82.00, 'EUR', 'active'),
  (7, 2, 2, 48.00, 'EUR', 'active'),
  (8, 2, 3, 36.00, 'EUR', 'active'),
  (9, 2, 4, 68.00, 'EUR', 'active'),
  (10, 2, 5, 99.00, 'EUR', 'active'),
  (11, 3, 1, 75.00, 'EUR', 'active'),
  (12, 3, 2, 42.00, 'EUR', 'active'),
  (13, 3, 3, 34.00, 'EUR', 'active'),
  (14, 3, 4, 63.00, 'EUR', 'active'),
  (15, 3, 5, 92.00, 'EUR', 'active'),
  (16, 4, 1, 70.00, 'EUR', 'active'),
  (17, 4, 2, 40.00, 'EUR', 'active'),
  (18, 4, 3, 32.00, 'EUR', 'active'),
  (19, 4, 4, 60.00, 'EUR', 'active'),
  (20, 4, 5, 88.00, 'EUR', 'active')
ON DUPLICATE KEY UPDATE
  garage_id = VALUES(garage_id),
  service_id = VALUES(service_id),
  price = VALUES(price),
  currency = VALUES(currency),
  status = VALUES(status);

INSERT INTO slots (
  slot_id,
  garage_id,
  start_datetime,
  end_datetime,
  status
) VALUES
  (
    1,
    1,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '09:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '09:30:00'),
    'available'
  ),
  (
    2,
    1,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '10:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '10:30:00'),
    'booked'
  ),
  (
    3,
    1,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '11:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '11:30:00'),
    'available'
  ),
  (
    4,
    1,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), '14:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), '14:30:00'),
    'available'
  ),
  (
    5,
    2,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '09:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '09:30:00'),
    'available'
  ),
  (
    6,
    2,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '10:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '10:30:00'),
    'blocked'
  ),
  (
    7,
    2,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '11:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '11:30:00'),
    'available'
  ),
  (
    8,
    3,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '09:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '09:30:00'),
    'booked'
  ),
  (
    9,
    3,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '10:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '10:30:00'),
    'available'
  ),
  (
    10,
    3,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), '11:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), '11:30:00'),
    'available'
  ),
  (
    11,
    4,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '14:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), '14:30:00'),
    'available'
  ),
  (
    12,
    4,
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '15:00:00'),
    TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '15:30:00'),
    'available'
  )
ON DUPLICATE KEY UPDATE
  garage_id = VALUES(garage_id),
  start_datetime = VALUES(start_datetime),
  end_datetime = VALUES(end_datetime),
  status = VALUES(status);

INSERT INTO reservations (
  reservation_id,
  user_id,
  garage_id,
  service_id,
  slot_id,
  status,
  vehicle_registration,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_version,
  confirmed_at
) VALUES
  (
    1,
    2,
    1,
    1,
    2,
    'confirmed',
    'AB-123-CD',
    'Renault',
    'Clio',
    2018,
    '1.5 dCi',
    CURRENT_TIMESTAMP
  ),
  (
    2,
    2,
    3,
    3,
    8,
    'pending',
    'EF-456-GH',
    'Peugeot',
    '308',
    2020,
    'BlueHDi',
    NULL
  )
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  garage_id = VALUES(garage_id),
  service_id = VALUES(service_id),
  slot_id = VALUES(slot_id),
  status = VALUES(status),
  vehicle_registration = VALUES(vehicle_registration),
  vehicle_make = VALUES(vehicle_make),
  vehicle_model = VALUES(vehicle_model),
  vehicle_year = VALUES(vehicle_year),
  vehicle_version = VALUES(vehicle_version),
  confirmed_at = VALUES(confirmed_at);

INSERT INTO contacts (
  contact_id,
  name,
  email_or_phone,
  message,
  status
) VALUES
  (
    1,
    'Marie Dupont',
    'marie.dupont@example.local',
    'Bonjour, je souhaite obtenir plus d''informations sur les disponibilités à Paris.',
    'new'
  ),
  (
    2,
    'Ahmed Martin',
    '0600000002',
    'Pouvez-vous me confirmer le tarif pour une contre-visite ?',
    'read'
  ),
  (
    3,
    'Sophie Bernard',
    'sophie.bernard@example.local',
    'Message de test archivé pour la démonstration locale.',
    'archived'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email_or_phone = VALUES(email_or_phone),
  message = VALUES(message),
  status = VALUES(status);

COMMIT;

-- Seed data ready for local demo testing.
-- Run this file after database/schema.sql.

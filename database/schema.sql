-- Project: Controle One
-- File: database/schema.sql
-- Purpose: MPD / SQL schema for the MVP database
-- This file creates the database and the core MVP tables.
-- No seed data is included in this file.
-- No DROP DATABASE statement is included.
-- No destructive reset logic is included.

CREATE DATABASE IF NOT EXISTS controle_one
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE controle_one;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('client','garage','admin') NOT NULL DEFAULT 'client',
  status ENUM('active','inactive','blocked') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS garages (
  garage_id INT AUTO_INCREMENT PRIMARY KEY,
  manager_user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(30),
  email VARCHAR(190),
  description TEXT,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_garages_manager_user_id (manager_user_id),
  CONSTRAINT fk_garages_manager_user_id
    FOREIGN KEY (manager_user_id)
    REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  service_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tariffs (
  tariff_id INT AUTO_INCREMENT PRIMARY KEY,
  garage_id INT NOT NULL,
  service_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_tariffs_garage_service UNIQUE (garage_id, service_id),
  INDEX idx_tariffs_service_id (service_id),
  CONSTRAINT fk_tariffs_garage_id
    FOREIGN KEY (garage_id)
    REFERENCES garages(garage_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_tariffs_service_id
    FOREIGN KEY (service_id)
    REFERENCES services(service_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS slots (
  slot_id INT AUTO_INCREMENT PRIMARY KEY,
  garage_id INT NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  status ENUM('available','booked','blocked') NOT NULL DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slots_garage_id (garage_id),
  CONSTRAINT fk_slots_garage_id
    FOREIGN KEY (garage_id)
    REFERENCES garages(garage_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservations (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  garage_id INT NOT NULL,
  service_id INT NOT NULL,
  slot_id INT NOT NULL,
  status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  vehicle_registration VARCHAR(30),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year SMALLINT,
  vehicle_version VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  cancelled_at DATETIME NULL,
  confirmed_at DATETIME NULL,
  CONSTRAINT uq_reservations_slot_id UNIQUE (slot_id),
  INDEX idx_reservations_user_id (user_id),
  INDEX idx_reservations_garage_id (garage_id),
  INDEX idx_reservations_service_id (service_id),
  CONSTRAINT fk_reservations_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_reservations_garage_id
    FOREIGN KEY (garage_id)
    REFERENCES garages(garage_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_reservations_service_id
    FOREIGN KEY (service_id)
    REFERENCES services(service_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_reservations_slot_id
    FOREIGN KEY (slot_id)
    REFERENCES slots(slot_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Reservation.garage_id must match the garage_id of the selected slot.
-- This consistency rule will be checked in the backend reservation creation logic.
-- It is not implemented with a trigger in this MVP schema.

CREATE TABLE IF NOT EXISTS contacts (
  contact_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email_or_phone VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','read','archived') NOT NULL DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Contacts are independent and do not have a foreign key to users.

-- Schema ready for local MySQL/phpMyAdmin testing.
-- Seed data is not included in this file.

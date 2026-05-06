# Controle One — Schéma SQL MVP

## Objectif

Ce document décrit le contenu du fichier `database/schema.sql` pour le projet Controle One.
Il correspond au travail de la Card 4, dédiée à la préparation du MPD et du schéma SQL MVP.

## Important

La Card 4 concerne uniquement l'étape **MPD / SQL schema**.
Dans cette étape, le fichier `schema.sql` est préparé pour définir la structure principale de la base de données.

Cette étape ne concerne pas encore :

- la création des API backend
- l'intégration avec le frontend
- l'exécution du SQL dans MySQL

## Database

- database name: `controle_one`
- engine: `InnoDB`
- charset: `utf8mb4`
- collation: `utf8mb4_unicode_ci`

## Tables

Le schéma MVP contient 7 tables principales :

- `users`
- `garages`
- `services`
- `tariffs`
- `slots`
- `reservations`
- `contacts`

## Résumé des tables

### users

Objectif : stocker les comptes utilisateurs de la plateforme.

- PK: `user_id`
- FK: aucune
- UNIQUE: `email`
- statuts importants: `active`, `inactive`, `blocked`
- rôles importants: `client`, `garage`, `admin`

### garages

Objectif : stocker les centres/garages qui proposent des créneaux de contrôle technique.

- PK: `garage_id`
- FK: `manager_user_id` vers `users.user_id`
- UNIQUE: aucune
- statuts importants: `active`, `inactive`

### services

Objectif : stocker les types de services proposés, par exemple un contrôle technique standard.

- PK: `service_id`
- FK: aucune
- UNIQUE: aucune
- statuts importants: `active`, `inactive`

### tariffs

Objectif : associer un garage, un service et un prix.

- PK: `tariff_id`
- FK: `garage_id` vers `garages.garage_id`, `service_id` vers `services.service_id`
- UNIQUE: `UNIQUE(garage_id, service_id)`
- statuts importants: `active`, `inactive`

### slots

Objectif : stocker les créneaux disponibles, réservés ou bloqués pour chaque garage.

- PK: `slot_id`
- FK: `garage_id` vers `garages.garage_id`
- UNIQUE: aucune
- statuts importants: `available`, `booked`, `blocked`

### reservations

Objectif : stocker les réservations effectuées par les clients.

- PK: `reservation_id`
- FK: `user_id` vers `users.user_id`, `garage_id` vers `garages.garage_id`, `service_id` vers `services.service_id`, `slot_id` vers `slots.slot_id`
- UNIQUE: `UNIQUE(slot_id)`
- statuts importants: `pending`, `confirmed`, `cancelled`, `completed`

Les informations du véhicule sont stockées directement dans cette table.

### contacts

Objectif : stocker les messages de contact envoyés via la plateforme.

- PK: `contact_id`
- FK: aucune
- UNIQUE: aucune
- statuts importants: `new`, `read`, `archived`

La table `contacts` est indépendante et ne possède pas de clé étrangère vers `users`.

## Constraints importantes

- `users.email` est unique.
- `tariffs` utilise `UNIQUE(garage_id, service_id)`.
- `reservations.slot_id` est unique pour empêcher plusieurs réservations sur le même créneau.
- `tariffs.price` utilise `DECIMAL(10,2)` et non `FLOAT`.
- `contacts` est indépendant et n'a pas de relation obligatoire avec `users`.
- `Vehicle` n'est pas une table séparée dans ce MVP.
- Les informations véhicule sont stockées dans `reservations`.
- `Reservation.garage_id` doit correspondre au garage du slot sélectionné.
- La cohérence entre `Reservation.garage_id` et `Slot.garage_id` sera contrôlée plus tard dans la logique backend.

## Ce qui n'est pas inclus

- seed data
- API endpoints
- migrations
- frontend integration
- payment
- notification
- review
- vehicle table

## Test local

Le fichier `database/schema.sql` pourra être testé plus tard dans MySQL ou phpMyAdmin pour vérifier la création de la base et des tables.

Pour l'instant, ce document sert uniquement de documentation du schéma SQL MVP.

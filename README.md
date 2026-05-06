# Controle One — Backend

## Présentation

Ce repository contient le backend du projet **Controle One**. Il sert de base technique pour exposer une API côté serveur, organisée avec Node.js, Express et MySQL.

## Rôle du repository

Ce repository est dédié uniquement au backend. Le frontend existe dans un repository séparé :

```text
controle-one-frontend-
```

Aucun asset frontend, fichier média ou fichier généré du frontend ne doit être ajouté dans ce repository backend.

## Objectif du backend

Le backend fournit une API JSON qui sera consommée par le frontend avec `fetch()`. Il centralise la logique serveur, les routes API, les contrôleurs, la configuration et, plus tard, la connexion à la base de données MySQL.

## Stack technique

- Node.js
- Express
- MySQL
- mysql2
- dotenv
- cors
- bcrypt
- jsonwebtoken
- phpMyAdmin pour visualiser la base de données locale
- Postman pour tester les endpoints

## Objectif local-first

La première version du projet est pensée pour fonctionner en local afin de préparer la présentation finale. Le backend pourra être déployé en ligne plus tard, mais l'objectif actuel est d'avoir une base simple, claire et stable pour le développement local.

## Structure du repository

```text
src/
  app.js
  server.js
  config/
  routes/
  controllers/
  middlewares/
  services/
  utils/
database/
docs/
```

- `src/` contient le code principal du backend.
- `src/config/` contient la configuration technique, notamment la future configuration MySQL.
- `src/routes/` contient les routes Express.
- `src/controllers/` contient les fonctions qui répondent aux requêtes HTTP.
- `src/middlewares/` contient les middlewares Express, comme la gestion des erreurs.
- `src/services/` contiendra plus tard la logique métier.
- `src/utils/` contient les helpers partagés, comme les réponses API standardisées.
- `database/` contient les fichiers SQL de préparation, pour l'instant uniquement sous forme de placeholders.
- `docs/` contient la documentation technique du projet backend.

## Stratégie Git

- `main` = version stable
- `develop` = développement
- `feature/backend-setup` = initialisation backend

## Installation

```bash
npm install
```

## Lancer le serveur en développement

```bash
npm run dev
```

## Endpoint de test

```http
GET http://localhost:5000/api/health
```

Réponse attendue :

```json
{
  "success": true,
  "message": "Controle One backend is running",
  "data": {
    "status": "ok"
  }
}
```

## Variables d'environnement

Créer un fichier `.env` à partir du fichier `.env.example`, puis adapter les valeurs si nécessaire pour l'environnement local.

Exemple :

```bash
cp .env.example .env
```

Le fichier `.env` ne doit pas être commit.

## État actuel du projet

Le projet est actuellement uniquement en phase d'**initialisation backend**. La structure de base est préparée, mais les fonctionnalités principales ne sont pas encore développées.

À ce stade, les modules suivants ne sont pas encore implémentés :

- authentification
- garages
- réservations
- recherche
- schéma réel de base de données

## Prochaines étapes

- modélisation MCD / MLD / MPD
- création du schéma MySQL
- connexion MySQL
- authentification
- API garages
- API créneaux
- API réservations
- connexion avec le frontend

## Note importante sur les fichiers lourds

Les fichiers lourds, générés ou non nécessaires au backend ne doivent pas être commit dans ce repository.

À ne pas commit :

- `node_modules`
- fichiers build
- fichiers media
- images
- vidéos
- PDF
- archives
- fichiers temporaires

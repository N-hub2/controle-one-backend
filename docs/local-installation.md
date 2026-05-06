# Local installation

## Requirements

- Node.js
- npm
- MySQL for later database setup

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file from the example:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

Test the health endpoint:

```bash
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Controle One backend is running",
  "data": {
    "status": "ok"
  }
}
```

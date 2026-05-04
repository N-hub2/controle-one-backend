# API routes

## Health

### GET `/api/health`

Returns a basic JSON response confirming that the backend is running.

Example response:

```json
{
  "success": true,
  "message": "Controle One backend is running",
  "data": {
    "status": "ok"
  }
}
```

Main APIs such as auth, garages, reservations, search, and contacts will be added later.

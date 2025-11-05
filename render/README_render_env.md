Render environment variables — copy/paste these into Render UI

Paste each key and a value in your Render service's Environment section (do NOT paste secrets into chat).

Minimal & recommended environment variables for backend (server):

- DB_USER                -> postgres
- DB_HOST                -> <render-postgres-host or external host>
- DB_DATABASE            -> fraud_detection_new
- DB_PASSWORD            -> <your-db-password>
- DB_PORT                -> 5432
- DB_SSL                 -> false

- REDIS_HOST            -> <render-redis-host or external host>
- REDIS_PORT            -> 6379
- REDIS_PASSWORD        -> <if any; else leave blank>

- ML_PREDICTION_SERVICE_URL -> http://127.0.0.1:8000   # change if you have a real ML service

- JWT_SECRET            -> <strong-random-string>   # e.g. use 32+ bytes from a password generator
- JWT_EXPIRES_IN        -> 1d
- ENCRYPTION_KEY        -> <32+ byte hex string>

- NODE_ENV              -> production
- PORT                  -> 5000

Optional (frontend integration):
- FRONTEND_URL          -> https://<your-frontend-domain>

Frontend environment (client):
- REACT_APP_API_URL     -> https://<your-backend-service>.onrender.com

Notes and quick tips:
- If you use Render's managed Postgres/Redis, create those services first and copy their connection details here.
- Keep `JWT_SECRET` and `ENCRYPTION_KEY` secret — enter them in Render's UI under Environment (they're stored securely).
- After adding env vars, re-deploy the service so the new config is picked up.

If you want, I can produce a single-file checklist with the exact values to paste (you'll only need to replace the secrets). Say "produce checklist" and I'll write it into `render/RENDER_CHECKLIST.md` for you to open and copy from.
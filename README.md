# Mobile Money Fraud Detection — Quick Simulation Guide

This repository contains a full-stack fraud detection system (backend: Express + PostgreSQL, frontend: React). I added a small simulation endpoint and synchronization improvements so anomalies and transactions stay linked automatically.

What I changed
- Added transaction simulation endpoint: `POST /api/transactions/simulate` (admin/analyst only). It creates synthetic transactions, runs ML prediction, stores transactions, and creates anomalies when detected.
- When an anomaly is created, the related transaction now gets updated (is_fraud: true, risk_score set) and a `transactionUpdated` socket event is emitted.
- When an anomaly is updated or deleted, the related transaction is synchronized (risk_score and is_fraud may be updated) and socket events are emitted.

How to use the simulation (dev)
1. Start the backend (from `server/`): ensure environment variables are set (DB, Redis, JWT_SECRET). Then run:

```powershell
# from repository root
cd server
npm install
npm start
```

2. Simulate transactions (PowerShell example):

```powershell
# Send a single simulated transaction
Invoke-RestMethod -Uri "http://localhost:5000/api/transactions/simulate" -Method Post -Body @"{"count":1}"@ -ContentType 'application/json'

# Send 10 simulated transactions
Invoke-RestMethod -Uri "http://localhost:5000/api/transactions/simulate?count=10" -Method Post -Body '{}' -ContentType 'application/json'
```

Notes
- The simulate endpoint is protected by auth (admin/analyst). For local testing you can temporarily remove the `protect` middleware in `server/routes/transactionRoutes.js` or call the endpoint through the `/api/data/generate` helper route for authenticated requests.
- The simulation uses the same ML prediction pipeline as normal ingestion, so anomalies created from simulated transactions will be processed the same way.

If you want, I can:
- Add an unauthenticated `dev` flag to allow simulation without auth in local env.
- Create a small test that runs the simulation and asserts that transactions and anomalies are linked in the DB.
- Hook up a periodic worker to simulate a stream of transactions (useful for load testing).

What I did next
- Implemented code changes to keep transaction and anomaly records synchronized.
- Added the `/api/transactions/simulate` endpoint and a short guide above.

If you'd like me to add tests or a periodic simulator (CRON/worker), tell me how many simulated transactions per minute you'd like and whether authentication should be required for the simulation endpoint.

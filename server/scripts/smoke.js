const express = require('express');
const { logger, httpLogger } = require('../utils/logger');
const clientMetrics = require('prom-client');

(async () => {
  try {
    clientMetrics.collectDefaultMetrics({ timeout: 5000 });

    const app = express();
    app.use(httpLogger);

    app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', clientMetrics.register.contentType);
        res.end(await clientMetrics.register.metrics());
      } catch (err) {
        res.status(500).end(err.message);
      }
    });

    app.get('/api/ping', (req, res) => {
      logger.info({ route: '/api/ping' }, 'Ping received (smoke)');
      res.json({ success: true, message: 'Pong (smoke)'});
    });

    const port = process.env.PORT || 5004;
    app.listen(port, '0.0.0.0', () => {
      logger.info({ port }, `Smoke server running on port ${port}`);
    });
  } catch (err) {
    console.error('Smoke server failed to start:', err);
    process.exit(1);
  }
})();

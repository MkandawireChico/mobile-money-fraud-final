// server/socket/websocketHandler.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

let wsServer = null;
let dashboardClients = new Set();

const initializeWebSocketServer = (server, services) => {
    const { userModel } = services;

    wsServer = new WebSocket.Server({
        server,
        path: '/ws/dashboard'
    });

    wsServer.on('connection', async (ws, req) => {
        try {
            // Parse the URL to get query parameters
            const query = url.parse(req.url, true).query;
            const token = query.token || req.headers.authorization?.replace('Bearer ', '');

            if (!token) {

                ws.close(1008, 'No authentication token');
                return;
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);

            if (!user || user.status !== 'active') {

                ws.close(1008, 'Invalid user');
                return;
            }

            ws.user = user;
            console.log(`✅ [WebSocket] Dashboard connection established for user: ${user.username} (${user.role})`);

        // Add to dashboard clients
        dashboardClients.add(ws);

        // Send initial connection confirmation
        ws.send(JSON.stringify({
            type: 'connection_established',
            payload: {
                message: 'Dashboard WebSocket connected',
                user: user.username,
                timestamp: new Date().toISOString()
            }
        }));

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log(`📨 [WebSocket] Message from ${user.username}:`, data);

                switch (data.type) {
                    case 'ping':
                        ws.send(JSON.stringify({
                            type: 'pong',
                            payload: { timestamp: new Date().toISOString() }
                        }));
                        break;
                    case 'subscribe_dashboard':
                        // Client is subscribing to dashboard updates
                        ws.send(JSON.stringify({
                            type: 'subscription_confirmed',
                            payload: { message: 'Subscribed to dashboard updates' }
                        }));
                        break;
                    default:
                        console.log(`Unknown message type: ${data.type}`);
                }
            } catch (error) {
                console.error('[WebSocket] Error parsing message:', error);
            }
        });

        ws.on('close', (code, reason) => {
            console.log(`🔌 [WebSocket] Dashboard connection closed for ${user.username}: ${code} ${reason}`);
            dashboardClients.delete(ws);
        });

        ws.on('error', (error) => {
            console.error(`❌ [WebSocket] Error for ${user.username}:`, error);
            dashboardClients.delete(ws);
        });

        } catch (error) {
            console.error('[WebSocket] Authentication error:', error.message);
            ws.close(1008, 'Authentication failed');
        }
    });

    console.log('🚀 [WebSocket] Dashboard WebSocket server initialized on /ws/dashboard');
};

const broadcastDashboardMetrics = (metrics) => {
    const message = JSON.stringify({
        type: 'dashboard_metrics',
        payload: metrics,
        timestamp: new Date().toISOString()
    });

    dashboardClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    console.log(`📡 [WebSocket] Broadcasted dashboard metrics to ${dashboardClients.size} clients`);
};

const broadcastNewTransaction = (transaction) => {
    const message = JSON.stringify({
        type: 'new_transaction',
        payload: transaction,
        timestamp: new Date().toISOString()
    });

    dashboardClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    console.log(`📡 [WebSocket] Broadcasted new transaction to ${dashboardClients.size} clients`);
};

const broadcastNewAnomaly = (anomaly) => {
    const message = JSON.stringify({
        type: 'new_anomaly',
        payload: anomaly,
        timestamp: new Date().toISOString()
    });

    dashboardClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    console.log(`📡 [WebSocket] Broadcasted new anomaly to ${dashboardClients.size} clients`);
};

const broadcastMLMetricsUpdate = (mlMetrics) => {
    const message = JSON.stringify({
        type: 'ml_metrics_update',
        payload: mlMetrics,
        timestamp: new Date().toISOString()
    });

    dashboardClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    console.log(`📡 [WebSocket] Broadcasted ML metrics update to ${dashboardClients.size} clients`);
};

const broadcastSystemHealthUpdate = (systemHealth) => {
    const message = JSON.stringify({
        type: 'system_health_update',
        payload: systemHealth,
        timestamp: new Date().toISOString()
    });

    dashboardClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    console.log(`📡 [WebSocket] Broadcasted system health update to ${dashboardClients.size} clients`);
};

const getConnectedClientsCount = () => {
    return dashboardClients.size;
};

module.exports = {
    initializeWebSocketServer,
    broadcastDashboardMetrics,
    broadcastNewTransaction,
    broadcastNewAnomaly,
    broadcastMLMetricsUpdate,
    broadcastSystemHealthUpdate,
    getConnectedClientsCount
};

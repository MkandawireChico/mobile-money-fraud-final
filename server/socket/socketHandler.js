// server/socket/socketHandler.js

let ioInstance = null;
let anomalyServiceInstance = null;

const initializeSocketIO = (io, service) => {
    ioInstance = io;
    anomalyServiceInstance = service; // Store the anomalyService for use within the handler

    // Set ioInstance in anomalyService if the method exists
    if (anomalyServiceInstance && typeof anomalyServiceInstance.setIO === 'function') {
        try {
            anomalyServiceInstance.setIO(ioInstance);

        } catch (error) {
            console.error('[Socket.IO] Failed to set ioInstance in anomalyService:', error.message);
        }
    } else {
        console.warn('[Socket.IO] anomalyService.setIO method not found or service not provided.');
    }

    ioInstance.on('connection', (socket) => {
        // Assume socket.user is populated by middleware in app.js (e.g., { id, username, role })
        console.log('[Socket.IO] New connection attempt:', {
            user: socket.user,
            id: socket.id,
            handshake: socket.handshake.auth
        });
        
        if (!socket.user || !socket.user.id) {
            console.warn('[Socket.IO] Invalid user data on connection, but allowing connection:', socket.user);
            // Don't disconnect - allow anonymous connections for dashboard
            socket.user = socket.user || { id: 'anonymous', username: 'Dashboard User', role: 'viewer' };
        }

        // Join a private room for the user
        try {
            socket.join(`user:${socket.user.id}`);

        } catch (error) {
            console.error('[Socket.IO] Failed to join user room:', error.message);
        }

        // Users with 'admin' or 'analyst' roles join the 'anomalies' room
        if (socket.user.role === 'admin' || socket.user.role === 'analyst') {
            try {
                socket.join('anomalies');

            } catch (error) {
                console.error('[Socket.IO] Failed to join anomalies room:', error.message);
            }
        }

        // All users can join a general transactions feed room
        try {
            socket.join('transactions_feed');

        } catch (error) {
            console.error('[Socket.IO] Failed to join transactions feed room:', error.message);
        }

        socket.on('disconnect', (reason) => {

        });

        // Example: Listen for a test event from the client
        socket.on('ping', (data) => {
            console.log(`[Socket.IO] Received ping from ${socket.user.username}:`, data);
            socket.emit('pong', { message: `Pong from server to ${socket.user.username}`, received: data });
        });

        // Event for client to request initial anomalies
        socket.on('request_initial_anomalies', async () => {
            if (socket.user && (socket.user.role === 'admin' || socket.user.role === 'analyst')) {

                try {
                    const { anomalies: openAnomalies } = await anomalyServiceInstance.getAnomalies({ status: 'open' }, 10, 0);
                    socket.emit('initial_anomalies', openAnomalies);

                } catch (error) {
                    console.error('[Socket.IO] Error fetching initial anomalies:', error);
                    socket.emit('error_fetching_anomalies', { message: 'Failed to fetch initial anomalies.' });
                }
            } else {
                console.warn(`[Socket.IO] Unauthorized attempt to request initial anomalies by user ${socket.user?.username || 'unknown'}.`);
                socket.emit('unauthorized', { message: 'Not authorized to view anomalies.' });
            }
        });
    });
};

const emitNewAnomaly = (anomaly) => {
    if (!ioInstance) {
        console.error('[Socket.IO] ioInstance not initialized. Cannot emit new anomaly.');
        return;
    }

    ioInstance.to('anomalies').emit('newAnomaly', anomaly);
};

const emitAnomalyUpdated = (anomaly) => {
    if (!ioInstance) {
        console.error('[Socket.IO] ioInstance not initialized. Cannot emit anomaly update.');
        return;
    }

    ioInstance.to('anomalies').emit('anomalyUpdated', anomaly);
    if (anomaly.resolved_by && anomaly.resolved_by.id) {
        ioInstance.to(`user:${anomaly.resolved_by.id}`).emit('anomalyUpdated', anomaly);
    }
};

const emitAnomalyDeleted = (anomalyId) => {
    if (!ioInstance) {
        console.error('[Socket.IO] ioInstance not initialized. Cannot emit anomaly deletion.');
        return;
    }

    ioInstance.to('anomalies').emit('anomalyDeleted', anomalyId);
};

const emitTransactionProcessed = (transaction) => {
    if (!ioInstance) {
        console.error('[Socket.IO] ioInstance not initialized. Cannot emit transaction processed event.');
        return;
    }

    ioInstance.to('transactions_feed').emit('transactionProcessed', transaction);
};

const emitFraudAlert = (alertData) => {
    console.warn('[Socket.IO] emitFraudAlert is deprecated. Use emitNewAnomaly instead.');
    if (!ioInstance) {
        console.error('[Socket.IO] ioInstance not initialized. Cannot emit fraud alert.');
        return;
    }

    ioInstance.to('anomalies').emit('fraudAlert', alertData);
};

module.exports = {
    initializeSocketIO,
    emitNewAnomaly,
    emitAnomalyUpdated,
    emitAnomalyDeleted,
    emitTransactionProcessed,
    emitFraudAlert, // Kept as deprecated
};
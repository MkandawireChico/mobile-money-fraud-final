require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const redis = require('redis');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const { pool } = require('./config/db');
const { setupSwagger } = require('./config/swagger');
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('connect', () => console.log('Redis connected'));
redisClient.on('error', err => console.error('Redis error:', err));

async function initializeApp() {
    try {
        await redisClient.connect();
        console.log('Redis connected');

        const pgClient = await pool.connect();
        pgClient.release();
        console.log('PostgreSQL connected');

        try {
            const mlBaseUrl = process.env.ML_PREDICTION_SERVICE_URL || 'http://localhost:8000';
            await axios.get(`${mlBaseUrl}/`);
            console.log('ML API connected');
        } catch (error) {
            console.warn('ML API unavailable:', error.message);
        }

        const User = require('./models/User');
        const Transaction = require('./models/Transaction');
        const Anomaly = require('./models/anomalyModel');
        const AuditLog = require('./models/AuditLog');
        const Setting = require('./models/Setting');
        const Rule = require('./models/Rule');

        const userModel = new User(pool);
        const transactionModel = new Transaction(pool);
        const anomalyModel = new Anomaly(pool);
        const auditLogModel = new AuditLog(pool);
        const settingModel = new Setting(pool);
        const ruleModel = new Rule(pool);

        const anomalyService = require('./services/anomalyService')(anomalyModel, transactionModel);
        const fraudDetectionService = require('./services/FraudDetectionService')(anomalyService);

        const { initializeSocketIO } = require('./socket/socketHandler');

        let authController;
        let userController;
        let transactionController;
        let anomalyController;
        let dashboardController;
        let auditLogController;
        let settingsController;
        let ruleController;

        const { protect, authorize } = require('./middleware/authMiddleware')(userModel, jwt);

        const storage = multer.memoryStorage();
        const upload = multer({
            storage: storage,
            limits: { fileSize: 50 * 1024 * 1024 }
        });

        const authRoutes = require('./routes/authRoutes');
        const transactionRoutes = require('./routes/transactionRoutes');
        const anomalyRoutes = require('./routes/anomalyRoutes');
        const dashboardRoutes = require('./routes/dashboardRoutes');
        const auditLogRoutes = require('./routes/auditLogRoutes');
        const settingsRoutes = require('./routes/settingsRoutes');
        const ruleRoutes = require('./routes/ruleRoutes');
        const mlRoutes = require('./routes/mlRoutes');
        const systemRoutes = require('./routes/systemRoutes');
        const userRoutes = require('./routes/userRoutes');
        const reportRoutes = require('./routes/reportRoutes');
        const performanceRoutes = require('./routes/performanceRoutes');

        const systemController = require('./controllers/systemController')();

        const app = express();
        const server = http.createServer(app);

        const io = new Server(server, {
            cors: {
                origin: [
                    process.env.CLIENT_URL || 'http://localhost:3000',
                    'http://localhost:3000',
                    'http://127.0.0.1:3000',
                    process.env.FRONTEND_URL || 'http://localhost:3000'
                ],
                methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                credentials: true,
                allowedHeaders: ["*"]
            },
            allowEIO3: true,
            transports: ['websocket', 'polling']
        });

        io.use(async (socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                console.log('[Socket.IO] No token provided, allowing anonymous connection for dashboard');
                socket.user = { id: 'anonymous', username: 'Dashboard User', role: 'viewer' };
                return next();
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await userModel.findById(decoded.id);

                if (!user || user.status !== 'active') {
                    return next(new Error('Authentication error: User not found or inactive.'));
                }

                socket.user = user;
                next();
            } catch (error) {
                next(new Error('Authentication error: Invalid token.'));
            }
        });

        const AuditService = require('./services/auditService');
        const auditService = new AuditService(auditLogModel);

        anomalyController = require('./controllers/anomalyController')(anomalyModel, transactionModel, auditLogModel, io);
        transactionController = require('./controllers/transactionController')(transactionModel, auditLogModel, io);
        authController = require('./controllers/authController')(userModel, jwt, bcrypt, redisClient, auditLogModel);
        userController = require('./controllers/userController')(userModel, auditLogModel);
        dashboardController = require('./controllers/dashboardController')(userModel, transactionModel, anomalyModel, auditLogModel, io, {}, anomalyController);
        auditLogController = require('./controllers/auditLogController')(auditLogModel);
        settingsController = require('./controllers/settingsController')(settingModel, auditLogModel);
        ruleController = require('./controllers/ruleController')(ruleModel, auditLogModel);

        initializeSocketIO(io, anomalyService);

        // Disable conflicting WebSocket server - using Socket.IO instead
        // const { initializeWebSocketServer } = require('./socket/websocketHandler');
        // initializeWebSocketServer(server, { userModel });

        // Trust first proxy if behind a reverse proxy (e.g., Render, Heroku)
        app.set('trust proxy', 1);

        // CORS configuration
        const corsOptions = {
          origin: process.env.FRONTEND_URL || 'http://localhost:3000',
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          credentials: true,
          optionsSuccessStatus: 200 // For legacy browser support
        };

        // Middleware
        app.use(cors(corsOptions));
        app.use(helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'"],
              imgSrc: ["'self'"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: [],
            },
          },
          crossOriginResourcePolicy: { policy: "same-site" },
          crossOriginOpenerPolicy: { policy: "same-origin" },
          crossOriginEmbedderPolicy: { policy: "require-corp" },
          referrerPolicy: { policy: 'same-origin' },
        }));

        app.use(securityHeaders);
        app.use(limiter);
        app.use(morgan('dev'));
        app.use(express.json({ limit: '10kb' }));
        app.use(express.urlencoded({ extended: true, limit: '10kb' }));

        try {
            setupSwagger(app);
            console.log('Swagger mounted');
        } catch (e) {
            console.warn('Swagger failed:', e.message);
        }

        app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

        app.get('/', (req, res) => {
            res.send('Fraud Detection Backend API is running!');
        });

        app.get('/api/ping', (req, res) => {
            res.json({ success: true, message: 'Pong from backend!' });
        });

        app.post('/api/data/generate', protect, authorize(['admin', 'analyst']), async (req, res) => {
            try {
                const transaction = req.body;
                if (!transaction || !transaction.transaction_id || !transaction.timestamp) {
                    return res.status(400).json({ error: 'Invalid transaction data: transaction_id and timestamp are required.' });
                }

                const anomaly = await anomalyService.createAnomalyFromTransaction(transaction);

                res.status(anomaly ? 201 : 200).json({
                    message: anomaly ? 'Anomaly created' : 'No anomaly detected',
                    anomaly,
                });
            } catch (error) {
                console.error('Data generation error:', error.message);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            standardHeaders: true,
            legacyHeaders: false,
        });
        const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
        const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

        app.use('/api/auth', authLimiter);
        app.use('/api/auth/login', loginLimiter);
        app.use('/api/auth/register', registerLimiter);

        app.use('/api/auth', authRoutes(authController, protect));

        const passwordRecoveryController = require('./controllers/passwordRecoveryController')(userModel, jwt, bcrypt, redisClient, auditLogModel);
        const passwordRecoveryRoutes = require('./routes/passwordRecoveryRoutes');
        app.use('/api/recovery', passwordRecoveryRoutes(passwordRecoveryController));

        app.use('/api/anomalies', anomalyRoutes(anomalyController, protect, authorize, upload));
        app.use('/api/transactions', transactionRoutes(transactionController, protect, authorize, upload));
        app.use('/api/dashboard', dashboardRoutes(dashboardController, protect, authorize));
        app.use('/api/audit-logs', auditLogRoutes(auditLogController, protect, authorize));
        app.use('/api/settings', settingsRoutes(settingsController, protect, authorize));
        app.use('/api/rules', ruleRoutes(ruleController, protect, authorize));
        app.use('/api/ml', mlRoutes(transactionModel, anomalyModel, auditLogModel, anomalyService, protect, authorize));
        app.use('/api/system', systemRoutes(systemController, protect, authorize));
        app.use('/api/users', userRoutes(userController, protect, authorize));
        app.use('/api/reports', reportRoutes({ Transaction: transactionModel, User: userModel, Anomaly: anomalyModel, AuditLog: auditLogModel }, {}, { authenticateToken: protect, requireRole: authorize }));

        const caseReviewRoutes = require('./routes/caseReviewRoutes');
        app.use('/api/case-review', caseReviewRoutes({ Transaction: transactionModel, AuditLog: auditLogModel, User: userModel }, { auditService }, { authenticateToken: protect, requireRole: authorize }));
        
        app.use('/api/performance', performanceRoutes(protect));

        const errorHandler = require('./middleware/errorHandler');
        app.use(errorHandler);

        // Only start the server if not in Vercel environment
        if (process.env.VERCEL !== '1') {
            const PORT = process.env.PORT || 5000;
            server.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });

            process.on('unhandledRejection', (err, promise) => {
                console.error(`Error: ${err.message}`);
                server.close(() => process.exit(1));
            });
        }

        module.exports = {
            app,
            server,
            io,
        };

    } catch (error) {
        console.error('Application failed to start:', error.message);
        process.exit(1);
    }
}

initializeApp();
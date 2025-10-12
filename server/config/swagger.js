//config/swagger.js

    const swaggerUi = require('swagger-ui-express');
    const swaggerJsdoc = require('swagger-jsdoc');

    // Swagger definition options
    const options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Fraud Detection System API',
                version: '1.0.0',
                description: 'API documentation for the Fraud Detection System backend.',
                contact: {
                    name: 'Support',
                    url: 'http://localhost:3000', // Replace with your support URL
                    email: 'support@example.com', // Replace with your support email
                },
            },
            servers: [
                {
                    url: 'http://localhost:5000/api', // Your API base URL
                    description: 'Development server',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
                    },
                },
                schemas: {
                    User: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid', description: 'User ID' },
                            username: { type: 'string', description: 'Unique username' },
                            email: { type: 'string', format: 'email', description: 'Unique email address' },
                            role: { type: 'string', enum: ['admin', 'analyst', 'viewer'], description: 'User role' },
                            status: { type: 'string', enum: ['active', 'inactive', 'suspended'], description: 'Account status' },
                            created_at: { type: 'string', format: 'date-time', description: 'Timestamp of creation' },
                            updated_at: { type: 'string', format: 'date-time', description: 'Timestamp of last update' },
                            last_login: { type: 'string', format: 'date-time', nullable: true, description: 'Timestamp of last login' },
                        },
                        required: ['username', 'email', 'role', 'status'],
                    },
                    Transaction: {
                        type: 'object',
                        properties: {
                            transaction_id: { type: 'string' },
                            user_id: { type: 'string', format: 'uuid' },
                            amount: { type: 'number', format: 'float' },
                            currency: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' },
                            sender_account: { type: 'string', nullable: true },
                            receiver_account: { type: 'string', nullable: true },
                            description: { type: 'string', nullable: true },
                            status: { type: 'string' },
                            location_city: { type: 'string', nullable: true },
                            location_country: { type: 'string', nullable: true },
                            device_type: { type: 'string', nullable: true },
                            os_type: { type: 'string', nullable: true },
                            merchant_id: { type: 'string', format: 'uuid', nullable: true },
                            merchant_category: { type: 'string', nullable: true },
                            is_fraud: { type: 'boolean' },
                            risk_score: { type: 'number', format: 'float' },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time' },
                            transaction_type: { type: 'string', nullable: true },
                            time_since_last_transaction_seconds: { type: 'number', nullable: true },
                            is_new_location: { type: 'boolean', nullable: true },
                            is_new_device: { type: 'boolean', nullable: true },
                            transaction_hour_of_day: { type: 'integer', nullable: true },
                            transaction_day_of_week: { type: 'integer', nullable: true },
                            user_total_transactions: { type: 'integer', nullable: true },
                            user_total_amount_spent: { type: 'number', format: 'float', nullable: true },
                            location: { type: 'string', nullable: true },
                            device_info: { type: 'object', nullable: true },
                            ip_address: { type: 'string', nullable: true },
                        },
                        required: ['transaction_id', 'user_id', 'amount', 'currency', 'timestamp', 'status', 'is_fraud', 'risk_score'],
                    },
                    Alert: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            transaction_id: { type: 'string', nullable: true },
                            rule_name: { type: 'string' },
                            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                            status: { type: 'string', enum: ['open', 'resolved', 'closed'] },
                            description: { type: 'string', nullable: true },
                            triggered_by: { type: 'object', nullable: true },
                            timestamp: { type: 'string', format: 'date-time' },
                            resolved_by: { type: 'string', format: 'uuid', nullable: true },
                            resolved_at: { type: 'string', format: 'date-time', nullable: true },
                            comments: { type: 'array', items: { type: 'object' }, nullable: true },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time' },
                            risk_score: { type: 'number', format: 'float' },
                            transaction_data: { type: 'object', nullable: true },
                            user_id: { type: 'string', format: 'uuid', nullable: true },
                            resolution_notes: { type: 'string', nullable: true },
                        },
                        required: ['rule_name', 'severity', 'status', 'timestamp', 'risk_score'],
                    },
                    AuditLog: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            user_id: { type: 'string', format: 'uuid', nullable: true },
                            username: { type: 'string', nullable: true },
                            action_type: { type: 'string' },
                            entity_type: { type: 'string', nullable: true },
                            entity_id: { type: 'string', nullable: true },
                            description: { type: 'string', nullable: true },
                            details: { type: 'object', nullable: true },
                            ip_address: { type: 'string', nullable: true },
                            timestamp: { type: 'string', format: 'date-time' },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time' },
                        },
                        required: ['action_type', 'timestamp'],
                    },
                    Rule: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string' },
                            description: { type: 'string', nullable: true },
                            rule_type: { type: 'string' },
                            definition: { type: 'object' }, // JSONB field
                            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                            status: { type: 'string', enum: ['active', 'inactive'] },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time' },
                        },
                        required: ['name', 'rule_type', 'definition', 'severity', 'status'],
                    },
                    Setting: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            key: { type: 'string' },
                            value: { type: 'string' },
                            description: { type: 'string', nullable: true },
                            type: { type: 'string' },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time' },
                        },
                        required: ['key', 'value', 'type'],
                    },
                },
            },
            security: [{
                bearerAuth: [],
            }],
        },
        apis: ['./routes/*.js'], // Path to the API docs (where your route files are)
    };

    const swaggerSpec = swaggerJsdoc(options);

    const setupSwagger = (app) => {
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        console.log('Swagger UI available at /api-docs');
    };

    module.exports = { setupSwagger };

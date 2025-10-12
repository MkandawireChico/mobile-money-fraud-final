#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
};

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
    subtitle: (msg) => console.log(`${colors.magenta}${msg}${colors.reset}`)
};

async function main() {
    log.title('🔐 Enterprise Credential Recovery System Setup');
    console.log();

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';

    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        log.info('Found existing .env file');
    } else {
        log.warning('No .env file found, will create a new one');
    }

    log.subtitle('Step 1: Emergency Master Key Configuration');
    console.log();

    let masterKey = '';
    if (envContent.includes('EMERGENCY_MASTER_KEY=')) {
        const existing = await question('Emergency master key already configured. Generate new one? (y/N): ');
        if (existing.toLowerCase() === 'y' || existing.toLowerCase() === 'yes') {
            masterKey = crypto.randomBytes(32).toString('hex');
            log.success('Generated new emergency master key');
        } else {
            log.info('Keeping existing emergency master key');
        }
    } else {
        masterKey = crypto.randomBytes(32).toString('hex');
        log.success('Generated emergency master key');
    }

    log.subtitle('Step 2: Email Service Configuration');
    console.log();
    console.log('Choose email service:');
    console.log('1. SendGrid (Recommended)');
    console.log('2. AWS SES');
    console.log('3. SMTP');
    console.log('4. Skip (Development only)');
    console.log();

    const emailChoice = await question('Select option (1-4): ');
    let emailConfig = '';

    switch (emailChoice) {
        case '1':
            const sendgridKey = await question('Enter SendGrid API Key: ');
            const fromEmail = await question('Enter from email address: ');
            const fromName = await question('Enter from name (default: Fraud Detection System): ') || 'Fraud Detection System';

            emailConfig = `
# Email Configuration - SendGrid
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=${sendgridKey}
EMAIL_FROM=${fromEmail}
EMAIL_FROM_NAME=${fromName}`;
            break;

        case '2':
            const awsRegion = await question('Enter AWS region (default: us-east-1): ') || 'us-east-1';
            const awsFromEmail = await question('Enter from email address: ');

            emailConfig = `
# Email Configuration - AWS SES
EMAIL_SERVICE=aws-ses
AWS_REGION=${awsRegion}
EMAIL_FROM=${awsFromEmail}
EMAIL_FROM_NAME=Fraud Detection System`;
            break;

        case '3':
            const smtpHost = await question('Enter SMTP host: ');
            const smtpPort = await question('Enter SMTP port (default: 587): ') || '587';
            const smtpUser = await question('Enter SMTP username: ');
            const smtpPass = await question('Enter SMTP password: ');
            const smtpFromEmail = await question('Enter from email address: ');

            emailConfig = `
# Email Configuration - SMTP
EMAIL_SERVICE=smtp
SMTP_HOST=${smtpHost}
SMTP_PORT=${smtpPort}
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}
EMAIL_FROM=${smtpFromEmail}
EMAIL_FROM_NAME=Fraud Detection System`;
            break;

        case '4':
            log.warning('Skipping email configuration - emails will be logged to console only');
            emailConfig = `
# Email Configuration - Development Only
EMAIL_SERVICE=console
EMAIL_FROM=noreply@localhost
EMAIL_FROM_NAME=Fraud Detection System`;
            break;

        default:
            log.error('Invalid option selected');
            process.exit(1);
    }

    log.subtitle('Step 3: Client URL Configuration');
    console.log();

    const clientUrl = await question('Enter client URL (default: http://localhost:3000): ') || 'http://localhost:3000';

    log.subtitle('Step 4: Security Configuration');
    console.log();

    const jwtSecret = await question('Enter JWT secret (leave empty to generate): ') || crypto.randomBytes(64).toString('hex');

    // Build new .env content
    const newEnvContent = `# Fraud Detection System - Environment Configuration
# Generated by setup-credential-recovery.js on ${new Date().toISOString()}

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=1h

# Client Configuration
CLIENT_URL=${clientUrl}

# Emergency Access Configuration
${masterKey ? `EMERGENCY_MASTER_KEY=${masterKey}` : '# EMERGENCY_MASTER_KEY=your_master_key_here'}
${emailConfig}

# Redis Configuration (Update if needed)
REDIS_HOST=localhost
REDIS_PORT=6379

# Database Configuration (Update if needed)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fraud_detection
DB_USER=postgres
DB_PASSWORD=your_password

# ML API Configuration (Update if needed)
ML_PREDICTION_SERVICE_URL=http://localhost:8000

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

    // Write .env file
    fs.writeFileSync(envPath, newEnvContent);
    log.success('.env file created/updated successfully');

    console.log();
    log.subtitle('Step 5: Installation Summary');
    console.log();

    log.info('Configuration completed successfully!');
    console.log();
    console.log('📋 Next Steps:');
    console.log('1. Review the generated .env file');
    console.log('2. Install email service dependencies if needed:');
    if (emailChoice === '1') {
        console.log('   npm install @sendgrid/mail');
    } else if (emailChoice === '2') {
        console.log('   npm install aws-sdk');
    } else if (emailChoice === '3') {
        console.log('   npm install nodemailer');
    }
    console.log('3. Start Redis server: redis-server');
    console.log('4. Start the application: npm run dev');
    console.log('5. Test the recovery system at: /password-reset-request');
    console.log();

    if (masterKey) {
        log.warning('IMPORTANT: Store your emergency master key securely!');
        console.log(`Emergency Master Key: ${colors.bright}${masterKey}${colors.reset}`);
        console.log();
    }

    log.subtitle('Step 6: Test Configuration (Optional)');
    console.log();

    const runTests = await question('Run basic configuration tests? (Y/n): ');
    if (runTests.toLowerCase() !== 'n' && runTests.toLowerCase() !== 'no') {
        await runConfigurationTests();
    }

    console.log();
    log.success('Setup completed! 🎉');
    console.log();
    console.log('📖 For detailed configuration options, see: CREDENTIAL_RECOVERY_SETUP.md');
    console.log('🔧 For troubleshooting, check the setup guide');
    console.log();

    rl.close();
}

async function runConfigurationTests() {
    log.info('Running configuration tests...');
    console.log();

    // Test 1: Check .env file
    try {
        require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
        log.success('Environment variables loaded successfully');
    } catch (error) {
        log.error('Failed to load environment variables');
        console.log(error.message);
    }

    // Test 2: Check JWT secret
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
        log.success('JWT secret is properly configured');
    } else {
        log.warning('JWT secret may be too short or missing');
    }

    // Test 3: Check emergency master key
    if (process.env.EMERGENCY_MASTER_KEY && process.env.EMERGENCY_MASTER_KEY.length >= 32) {
        log.success('Emergency master key is properly configured');
    } else {
        log.warning('Emergency master key may be too short or missing');
    }

    // Test 4: Check Redis connection (if available)
    try {
        const redis = require('redis');
        const client = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        });

        await client.connect();
        await client.ping();
        await client.disconnect();
        log.success('Redis connection test passed');
    } catch (error) {
        log.warning('Redis connection test failed - make sure Redis is running');
    }

    // Test 5: Check required dependencies
    const requiredDeps = ['express', 'jsonwebtoken', 'bcryptjs', 'redis'];
    for (const dep of requiredDeps) {
        try {
            require(dep);
            log.success(`Dependency ${dep} is available`);
        } catch (error) {
            log.error(`Dependency ${dep} is missing - run: npm install ${dep}`);
        }
    }

    console.log();
    log.info('Configuration tests completed');
}

process.on('uncaughtException', (error) => {
    log.error('Setup failed with error:');
    console.error(error.message);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log();
    log.info('Setup cancelled by user');
    rl.close();
    process.exit(0);
});

// Run the setup
main().catch((error) => {
    log.error('Setup failed:');
    console.error(error.message);
    process.exit(1);
});

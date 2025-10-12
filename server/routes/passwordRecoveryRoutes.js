

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Rate limiting for security
const recoveryRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        message: 'Too many recovery attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // limit each IP to 3 OTP requests per 5 minutes
    message: {
        message: 'Too many OTP requests from this IP, please try again after 5 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const emergencyRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2, // limit each IP to 2 emergency access attempts per hour
    message: {
        message: 'Too many emergency access attempts from this IP, please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = (passwordRecoveryController) => {

    router.post('/initiate-reset', recoveryRateLimit, passwordRecoveryController.initiatePasswordReset);

    router.post('/reset-password', recoveryRateLimit, passwordRecoveryController.resetPassword);

    router.post('/generate-otp', otpRateLimit, passwordRecoveryController.generateRecoveryOTP);

    router.post('/verify-otp', passwordRecoveryController.verifyRecoveryOTP);

    router.post('/emergency-access', emergencyRateLimit, passwordRecoveryController.emergencyAdminAccess);

    router.get('/options', passwordRecoveryController.getRecoveryOptions);

    return router;
};

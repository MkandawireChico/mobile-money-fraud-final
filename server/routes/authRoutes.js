const express = require('express');
const router = express.Router();

module.exports = (authController, protect) => {
    router.post('/register', authController.register);
    router.post('/login', authController.login);
    router.post('/logout', protect, authController.logout);
    router.post('/refresh-token', protect, authController.refreshToken);
    router.patch('/change-password', protect, authController.changePassword);

    return router;
};

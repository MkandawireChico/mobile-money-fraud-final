const express = require('express');

module.exports = (controller, protect, authorize) => {
    const router = express.Router();

    router.use(protect);

    router.get('/', authorize(['admin']), controller.getUsers);
    router.get('/:id', authorize(['admin']), controller.getUserById);
    router.post('/', authorize(['admin']), controller.createUser);
    router.put('/:id', authorize(['admin']), controller.updateUser);
    router.delete('/:id', authorize(['admin']), controller.deleteUser);
    router.patch('/:id/status', authorize(['admin']), controller.toggleUserStatus);
    router.post('/:id/reset-password', authorize(['admin']), controller.resetUserPassword);

    return router;
};
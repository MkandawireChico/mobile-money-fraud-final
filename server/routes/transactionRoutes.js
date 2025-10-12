const express = require('express');

module.exports = (controller, protect, authorize, upload) => {
    const router = express.Router();

    router.use(protect);

    router.get('/', authorize(['admin', 'analyst']), controller.getAllTransactions);

    router.get('/volume', authorize(['admin', 'analyst']), controller.getTransactionVolumeTrend);

    router.get('/types', authorize(['admin', 'analyst']), controller.getTransactionTypeDistribution);

    router.get('/trend/volume', authorize(['admin', 'analyst']), controller.getTransactionVolumeTrend);

    router.get('/trend/fraud_rate', authorize(['admin', 'analyst']), controller.getFraudRateTrend);

    router.get('/distribution/type', authorize(['admin', 'analyst']), controller.getTransactionTypeDistribution);

    router.get('/top-locations', authorize(['admin', 'analyst']), controller.getTopLocations);

    router.get('/top-fraudulent', authorize(['admin', 'analyst']), controller.getTopFraudulentTransactions);

    router.post('/ingest-csv', authorize(['admin']), upload.single('csvFile'), controller.ingestTransactionsFromCsv);

    router.post('/predict/batch', authorize(['admin', 'analyst']), controller.predictFraudForBatchTransactions);

    router.get('/:id', authorize(['admin', 'analyst']), controller.getTransactionById);

    router.post('/batch', authorize(['admin']), controller.createTransactionsBatch);

    router.post('/', authorize(['admin', 'analyst']), controller.createTransaction);

    router.put('/:id', authorize(['admin', 'analyst']), controller.updateTransaction);

    router.delete('/:id', authorize(['admin']), controller.deleteTransaction);

    router.post('/predict/:transaction_id', authorize(['admin', 'analyst']), controller.predictFraudForTransaction);

    return router;
};
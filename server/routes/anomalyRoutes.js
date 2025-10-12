const express = require('express');
const multer = require('multer');

module.exports = (anomalyController, protect, authorize, upload) => {
    const router = express.Router();

    router.use(protect);

    router.get('/', authorize(['admin', 'analyst']), anomalyController.getAnomalies);

    router.get('/rate-trends', authorize(['admin', 'analyst', 'user']), anomalyController.getAnomalyRateTrends);

    router.get('/distribution', authorize(['admin', 'analyst']), anomalyController.getAnomalyDistribution);

    router.get('/trends', authorize(['admin', 'analyst']), anomalyController.getAnomalyTrends);

    router.get('/export', authorize(['admin', 'analyst']), anomalyController.exportAnomaliesCSV);

    router.get('/:id', authorize(['admin', 'analyst']), anomalyController.getAnomalyById);

    router.post('/', authorize(['admin', 'analyst']), upload.single('file'), anomalyController.createAnomaly);

    router.put('/:id', authorize(['admin', 'analyst']), anomalyController.updateAnomaly);

    router.delete('/:id', authorize(['admin']), anomalyController.deleteAnomaly);

    return router;
};
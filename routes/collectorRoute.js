const express = require('express');
const router = express.Router();
const collectorController = require('../controller/collector.js');

router.get('/logout', collectorController.logout);
router.get('/',collectorController.getHome)
router.get('/profile', collectorController.getProfile);
router.get('/update/:taskId', collectorController.getUpdate);
router.post('/update/:taskId', collectorController.postUpdate);
router.get('/task', collectorController.getTasks);
router.get('/bin', collectorController.getBin);

module.exports = router;
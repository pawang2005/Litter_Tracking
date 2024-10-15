const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.js');
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });
// Admin Dashboard
router.get('/', adminController.getAdminDashboard);

// Create Collector
router.get('/create', adminController.getCreateCollector);
router.post('/create', upload.single('profilePicture'), adminController.postCreateCollector);


// Update Collector
router.get('/update/:collectorId', adminController.getUpdateCollector);
router.post('/update',upload.single('profilePicture'),  adminController.postUpdateCollector);

// Delete Collector
router.post('/delete/:collectorId', adminController.postDeleteCollector);

// Collector List
router.get('/collector', adminController.getCollectorList);

// User List
router.get('/user', adminController.getUserList);

// Complaints
router.get('/complain', adminController.getComplaints);
router.post('/complain/delete/:complainId', adminController.postDeleteComplaint);

router.get('/assign-task', adminController.getAssignTask);

// Assign Tasks
router.get('/assign/:collectorId', adminController.getAssign);
router.post('/assign', adminController.postAssign);

// Drives
router.get('/drives', adminController.getDrives);
router.post('/drives', adminController.postDrives);
router.get('/drives/:driveId/participants', adminController.getDriveParticipants);
router.post('/drives/delete/:driveId', adminController.postDeleteDrive);

// Task List
router.get('/task/:collectorId', adminController.getTaskList);

// Analytics
router.get('/analytic/:collectorId', adminController.getAnalytics);

//Create-Bin
router.get('/create-bin', adminController.getCreateBin);
router.post('/create-bin', adminController.postCreateBin);

router.get('/bin', adminController.getBin);

router.get('/update-bin/:binID', adminController.getParticularBin)
router.post('/update-bin/:binID', adminController.postUpdateBin);
// Logout
router.get('/logout', adminController.logout);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controller/user');
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router.get('/', userController.getIndex);
router.get('/profile', userController.getProfile);
router.get('/home', userController.getHome);
router.get('/signup', userController.getSignup);
router.post('/signup', upload.single('profilePicture'), userController.postSignup);
router.get('/capture', userController.getCapture);
router.post('/upload', upload.single('image'), userController.postUpload);
router.get('/drives', userController.getDrives);
router.get('/update', userController.getUpdate);
router.post('/update', upload.single('profilePicture'), userController.postUpdate);
router.get('/notifications', userController.getNotifications);
router.post('/apply', userController.postApply);
router.get('/complains', userController.getAllComplains)
router.get('/tips',userController.getTips);
router.get('/logout', userController.getLogout);

module.exports = router;
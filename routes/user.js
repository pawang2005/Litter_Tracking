const express = require('express');
const router = express.Router();
const user = require('../models/user.js')
const multer = require('multer')
const { complainModel } = require('../models/complain.js')
const path = require('path');
const drives = require('../models/drives.js');
const fs = require('fs');
const User = require('../models/user.js');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/images/uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});


const upload = multer({ storage: storage });

router.get('/', (req, res) => {
    return res.render('users/index')
})
router.get('/profile', async (req, res) => {
    const User = await user.findById(req.user.id);
    return res.render('users/profile', {
        user: User,
    });
})

router.get('/home', async (req, res) => {
    try {
        const complaints = await complainModel.find({});
        let usersInfo = [];

        for (const complaint of complaints) {
            const users = await user.findById(complaint.createdBy);
            if (users) {
                usersInfo.push({
                    firstname: users.firstname,
                    lastname: users.lastname,
                    profilePicture: users.profilePicture
                });
            }
        }
        const reversedData = complaints.map((complaint, index) => ({
            complaint,
            userInfo: usersInfo[index]
        })).reverse();

        return res.render('users/index', {
            user: req.user,
            reversedData: reversedData
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).send('An error occurred while fetching complaints');
    }
});

router.get('/signup', (req, res) => {
    return res.render('users/signup')
})
router.post('/signup', upload.single('profilePicture'), async (req, res) => {

    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const password = req.body.password;
    const email = req.body.email;
    const date = req.body.date;

    try {
        if (req.file) {
            const User = await user.create({ profilePicture: `/images/uploads/${req.file.filename}`, firstname: firstname, lastname: lastname, email: email, date: date, password: password });
            await User.save()
        }
        else {
            const User = await user.create({ firstname: firstname, lastname: lastname, email: email, date: date, password: password });
            await User.save()
        }

        return res.render('users/signin', { user: User });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Error occurred while creating the user.");
    }
});

router.get('/capture', (req, res) => {
    return res.render('users/capture', { user: req.user })
})

router.post('/upload', upload.single('image'), async (req, res) => {
    const { complain, address, location, category, weight } = req.body;
    const locationArray = JSON.parse(location);

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File upload failed' });
        }

        await complainModel.create({
            imageURL: `/images/uploads/${req.file.filename}`,
            complain: complain[1],
            address: address,
            createdBy: req.user.id,
            location: locationArray,
            date: Date.now(),
            category: category,
            weight: weight,
        });



        const newReports = {
            imageURL: `/images/uploads/${req.file.filename}`,
            complain: complain[1],
            address: address,
            date: Date.now(),
            category: category,
            weight: weight,
        };


        await user.findByIdAndUpdate(
            req.user.id,
            { $push: { reports: newReports } },
            { new: true, runValidators: true }
        );

        res.json({ message: 'File uploaded successfully', file: req.file });
    } catch (error) {
        console.log('Complain creation error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/drives', async (req, res) => {
    try {
        const userDrives = await drives.find({});
        res.render('users/drives', { user: req.user, drives: userDrives });
    } catch (error) {
        console.error('Error fetching drives:', error);
        res.status(500).render('error', { message: 'An error occurred while fetching drives' });
    }
});



router.get('/update', async (req, res) => {
    try {
        const userInfo = await user.findById(req.user.id);
        res.render('users/update', { user: req.user, users: userInfo });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/update', upload.single('profilePicture'), async (req, res) => {
    const { firstname, lastname, email, date } = req.body;

    try {
        if (!req.file) {
            const updatedUser = await user.findByIdAndUpdate(req.user.id, {
                firstname: firstname,
                lastname: lastname,
                email: email,
                date: date,
            }, { new: true });
            req.user = updatedUser;
            return res.redirect('/profile', { user: req.user });
        }
        else {
            const updatedUser = await user.findByIdAndUpdate(req.user.id, {
                profilePicture: `/images/uploads/${req.file.filename}`,
                firstname,
                lastname,
                email,
                date
            }, { new: true });
            req.user = updatedUser;
            return res.render('users/profile', { user: req.user });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/notifications', async (req, res) => {
    try {
        const complaints = await complainModel.find({ createdBy: req.user.id });
        return res.render('users/notification', { user: req.user, complaints: complaints });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).render('error', { message: 'An error occurred while fetching notifications' });
    }
});

router.post('/apply', async (req, res) => {
    try {
        const userDrives = await drives.find({});
        const driveId = req.body.driveId;
        const userId = req.user.id;
        if (!driveId) {
            return res.status(400).json({ message: 'Drive ID is required' });
        }

        const drive = await drives.findById(driveId);

        if (!drive) {
            return res.status(404).json({ message: 'Drive not found' });
        }

        if (drive.appliedUsers.includes(userId)) {
            return res.status(400).json({ message: 'You have already applied to this drive' });
        }

        if (drive.Applied >= drive.number) {
            return res.status(400).json({ message: 'This drive is already full' });
        }

        const result = await drives.findByIdAndUpdate(
            driveId,
            {
                $inc: { Applied: 1 },
                $push: { appliedUsers: userId }
            },
            { new: true }
        );

        res.redirect('/drives');
    } catch (error) {
        console.error('Error applying to drive:', error);
        res.status(500).json({ message: 'An error occurred while applying to the drive' });
    }
});

router.get('/logout', (req, res) => {
    return res.clearCookie('token').render('users/index');
});
module.exports = router
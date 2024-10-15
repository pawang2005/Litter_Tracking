const user = require('../models/user.js');
const { complainModel } = require('../models/complain.js');
const drives = require('../models/drives.js');

exports.getIndex = (req, res) => {
    return res.render('users/index');
};

exports.getProfile = async (req, res) => {
    const User = await user.findById(req.user.id);
    return res.render('users/profile', {
        user: User,
    });
};

exports.getHome = async (req, res) => {
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
};

exports.getSignup = (req, res) => {
    return res.render('users/signup');
};

exports.postSignup = async (req, res) => {
    const { firstname, lastname, password, email, date } = req.body;
    const { path: url, filename } = req.file;

    try {
        const prevUser = await user.findOne({ email });
        console.log(prevUser);

        if (prevUser) {
            return res.render('users/signup', { message: "Email Already Exists" });
        }
        let newUser;
        if (req.file) {
            newUser = new user({
                profilePicture: {url, filename},
                firstname,
                lastname,
                email,
                date,
                password
            });
        } else {
            newUser = new user({
                firstname,
                lastname,
                email,
                date,
                password
            });
        }

        await newUser.save();
        return res.render('users/signin', { user: newUser });

    } catch (error) {
        console.error(error);
        return res.status(500).send("Error occurred while creating the user.");
    }
};

exports.getCapture = (req, res) => {
    return res.render('users/capture', { user: req.user });
};

exports.postUpload = async (req, res) => {
    const { complain, address, location, category, weight } = req.body;
    let locationArray;
    try {
        locationArray = JSON.parse(location);
    } catch (error) {
        console.error('Error parsing location:', error);
        return res.status(400).json({ message: 'Invalid location data' });
    }

    const { path: url, filename } = req.file || {};

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File upload failed' });
        }

        const addressString = Array.isArray(address) ? address[0] : address;

        const newComplain = await complainModel.create({
            imageURL: { url, filename },
            complain: Array.isArray(complain) ? complain[1] : complain,
            address: addressString,
            createdBy: req.user.id,
            location: locationArray,
            date: Date.now(),
            category,
            weight,
        });

        const newReports = {
            imageURL: { url, filename },
            complain: Array.isArray(complain) ? complain[1] : complain,
            address: addressString,
            date: Date.now(),
            category,
            weight,
        };

        await user.findByIdAndUpdate(
            req.user.id,
            { $push: { reports: newReports } },
            { new: true, runValidators: true }
        );

        res.json({ message: 'File uploaded successfully', file: req.file });
    } catch (error) {
        console.error('Complain creation error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getDrives = async (req, res) => {
    try {
        const userDrives = await drives.find({});
        res.render('users/drives', { user: req.user, drives: userDrives });
    } catch (error) {
        console.error('Error fetching drives:', error);
        res.status(500).render('error', { message: 'An error occurred while fetching drives' });
    }
};

exports.getUpdate = async (req, res) => {
    try {
        const userInfo = await user.findById(req.user.id);
        res.render('users/update', { user: req.user, users: userInfo });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.postUpdate = async (req, res) => {
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
            return res.redirect('/profile');
        }
        else {
            const { path: url, filename } = req.file;  
            const updatedUser = await user.findByIdAndUpdate(req.user.id, {
                profilePicture: {url, filename},
                firstname,
                lastname,
                email,
                date
            }, { new: true });
            req.user = updatedUser;
            return res.redirect('/profile');
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const complaints = await complainModel.find({ createdBy: req.user.id });
        return res.render('users/notification', { user: req.user, complaints: complaints });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).render('error', { message: 'An error occurred while fetching notifications' });
    }
};

exports.postApply = async (req, res) => {
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
};

exports.getAllComplains = async(req, res) => {
    const complain = await complainModel.find({});
    // const complainInfo = complain.filter(element => element.status !== 'completed');
    return res.render('users/allComplains', { user: req.user, complains: complain });
}

exports.getTips = (req, res) => {
    return res.render('users/tips',{user: req.user});
}

exports.getLogout = (req, res) => {
    return res.clearCookie('token').render('users/index');
};
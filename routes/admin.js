const express = require('express')
const router = express.Router();

const { collectorModel } = require('../models/collector.js');
const User = require('../models/user.js');
const { complainModel } = require('../models/complain.js');
const { assignModel } = require('../models/taskAssign.js');
const driveModel = require('../models/drives.js')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

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

router.get('/', async (req, res) => {
    const collector = await collectorModel.find({})
    return res.render('admin/admin', { user: req.user, collectors: collector })
})

router.get('/create', (req, res) => {
    return res.render('admin/createCollector', { user: req.user });
})

router.post('/create', upload.single('profilePicture'),async (req, res) => {
    const { firstname,lastname, date,email, Area, password } = req.body;
    if(req.file){
        await collectorModel.create({profilePicture: `/images/uploads/${req.file.filename}`,firstname,lastname,date,email,Area,password});
    }
    else{
        await collectorModel.create(req.body);
    }
    return res.redirect('/admin/create')
})

router.post('/update', upload.single('profilePicture'), async (req, res) => {
    const { firstname, lastname, email, date, Area } = req.body;
    const collectorId = req.body.collectorId
    try {
        if (!req.file) {
            const updatedCollector = await collectorModel.findByIdAndUpdate(collectorId, {
                firstname: firstname,
                lastname: lastname,
                email: email,
                date: date,
                Area: Area
            }, { new: true });
            req.user = updatedCollector;
            return res.redirect('/admin/collector');
        }
        else {
            const updatedCollector = await collectorModel.findByIdAndUpdate(collectorId, {
                profilePicture: `/images/uploads/${req.file.filename}`,
                firstname,
                lastname,
                email,
                date,
                Area
            }, { new: true });
            req.user = updatedCollector;
            return res.redirect('/admin/collector');
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.post('/delete/:collectorId', async (req, res) => {
    const collectorId = req.params.collectorId;
    await collectorModel.findByIdAndDelete(collectorId);
    await assignModel.deleteMany({ assigneeId: collectorId })
    return res.redirect('/admin/collector')
})

router.get('/update/:collectorId',async(req, res)=>{
    const collectorId = req.params.collectorId;
    const collector = await collectorModel.findById(collectorId);
    return res.render('admin/updateCollector', { user: req.user, users: collector })
})

router.get('/collector', async (req, res) => {
    const collector = await collectorModel.find({})
    return res.render('admin/collectorList', { user: req.user, collectors: collector })
})

router.get('/user', async (req, res) => {
    const allUsers = await User.find({});
    return res.render('admin/users', { user: req.user, allUsers: allUsers })
})

router.get('/complain', async (req, res) => {
    const complain = await complainModel.find({})

    let complainInfo = [];
    complain.forEach(element => {
        if (element.status !== 'completed') {
            complainInfo.push(element)
        }
    })
    return res.render('admin/complain', { user: req.user, complains: complain })
})


router.post('/complain/delete/:complainId', async (req, res) => {
    try {
        const complainId = req.params.complainId;

        // Find the complaint
        const complain = await complainModel.findById(complainId);
        if (!complain) {
            return res.status(404).send('Complaint not found');
        }

        // Update the user document to remove the complaint from reports
        const updateResult = await User.updateOne(
            { _id: complain.createdBy },
            {
                $pull: {
                    reports: { complain: complain.complain }
                }
            }
        );

        if (updateResult.modifiedCount === 0) {
            console.log('User document was not updated. Report may not exist in user\'s reports.');
        }

        // Delete the complaint
        await complainModel.findByIdAndDelete(complainId);

        return res.redirect('/admin/complain');
    } catch (error) {
        console.error('Error deleting complaint:', error);
        res.status(500).send('An error occurred while deleting the complaint');
    }
});


router.get('/assign/:collectorId', async (req, res) => {
    try {
        const user = req.user;
        const collectorId = req.params.collectorId;
        const complain = await complainModel.find({ status: "pending" });
        return res.render('admin/assign', { user: user, complain: complain, collectorId: collectorId });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


router.post('/assign', async (req, res) => {
    try {
        const { complainId, collectorId } = req.body;
        const user = await User.findById(req.user.id);
        const complain = await complainModel.findById(complainId);
        const collector = await collectorModel.findById(collectorId);

        if (!complain || !collector) {
            return res.status(400).send('Invalid complain or collector ID');
        }

        await assignModel.create({
            assignee: collector.firstname,
            assigneeId: collectorId,
            assigner: user.firstname,
            task: complain.complain,
            status: "assigned",
            imageURL: complain.imageURL,
            location: complain.location,
            address: complain.address,
            complainID: complain._id,
            weight: complain.weight,
            category: complain.category
        });

        complain.status = "assigned";

        await complain.updateOne({ status: 'assigned' });
        await complain.save();
        return res.redirect(`/admin/assign/${collectorId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

router.get('/drives', async (req, res) => {
    try {
        const currentDate = getCurrentDate();
        await driveModel.deleteMany({ date: { $lt: currentDate } });
        const drives = await driveModel.find({}).populate('appliedUsers', 'firstname lastname email');
        return res.render('admin/drives', { user: req.user, drives: drives });
    } catch (error) {
        console.error('Error processing drives:', error);
        res.status(500).send('An error occurred while processing drives');
    }
});

router.post('/drives', async (req, res) => {
    const { location, date, number } = req.body
    const currentDate = getCurrentDate();
    if (date < currentDate) {
        return res.status(400).send('Invalid date');
    }
    else { const drive = await driveModel.create({ location, date, number }) }
    return res.redirect('/admin/drives');
});

router.get('/drives/:driveId/participants', async (req, res) => {
    try {
        const drive = await driveModel.findById(req.params.driveId).populate('appliedUsers', 'firstname lastname email');
        if (!drive) {
            return res.status(404).send('Drive not found');
        }
        res.json(drive.appliedUsers);
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).send('An error occurred while fetching participants');
    }
});

router.post('/drives/delete/:driveId', async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).send('Unauthorized');
        }

        const driveId = req.params.driveId;

        await driveModel.findByIdAndDelete(driveId);
        const drives = await driveModel.find({}).populate('appliedUsers', 'firstname lastname email');
        res.redirect('/admin/drives');
    } catch (error) {
        console.error('Error deleting drive:', error);
        res.status(500).send('An error occurred while deleting the drive');
    }
});

router.get('/task', async (req, res) => {
    const task = await assignModel.find()
    return res.render('admin/taskAssigned', { task: task, user: req.user })
})

router.get('/analytic/:collectorId', async (req, res) => {
    try {
        const analytics = [];

        const collectorId = req.params.collectorId;
        const collector = await collectorModel.findById(collectorId)
        const assignments = await assignModel.find({ assigneeId: collectorId });
        const categoryCount = {
            Electronic: 0,
            Dry: 0,
            Wet: 0,
            Glass: 0,
            Plastic: 0,
            RadioActive: 0
        };
        const weightCount = {
            'Under 1kg': 0,
            '1-5kg': 0,
            '5-10kg': 0,
            'Above 10kg': 0
        };

        let totalTimeDiff = 0;
        assignments.forEach(assignment => {
            const timeDiff = assignment.updatedAt - assignment.createdAt;
            totalTimeDiff += timeDiff;
            categoryCount[assignment.category]++;
            weightCount[assignment.weight]++;
        });
        const avgTimeToComplete = assignments.length > 0 ? totalTimeDiff / assignments.length : 0;
        analytics.push({
            collectorId: collectorId,
            name: collector.firstname,
            taskCompleted: collector.taskCompleted,
            avgTimeToComplete: avgTimeToComplete,
            categoryBreakdown: categoryCount,
            weightBreakdown: weightCount
        });


        return res.render('admin/analytic', {
            user: req.user,
            analytics: analytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).send('Error fetching analytics');
    }
});



router.get('/logout', (req, res) => {
    res.clearCookie('token').redirect('/')
})

module.exports = router
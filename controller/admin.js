const { collectorModel } = require('../models/collector');
const User = require('../models/user');
const { complainModel } = require('../models/complain');
const { assignModel } = require('../models/taskAssign');
const { binModel } = require('../models/bin')
const driveModel = require('../models/drives');

const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}



exports.getAdminDashboard = async (req, res) => {
    const collector = await collectorModel.find({});
    return res.render('admin/home', { user: req.user, collectors: collector });
};

exports.getCreateCollector = (req, res) => {
    return res.render('admin/createCollector', { user: req.user });
};

exports.postCreateCollector = async (req, res) => {

    const { firstname, lastname, date, email, Area, password } = req.body;

    try {
        if (req.file) {
            const { path: url, filename } = req.file;
            await collectorModel.create({ profilePicture: { url, filename }, firstname, lastname, date, email, Area, password });
        } else {
            await collectorModel.create(req.body);
        }
        return res.redirect('/admin/create');
    } catch (error) {
        console.error('Error creating collector:', error);
        res.status(500).send('Server Error');
    }
};


exports.postUpdateCollector = async (req, res) => {
    const { firstname, lastname, email, date, Area, collectorId } = req.body;

    try {
        const updateData = {
            firstname,
            lastname,
            email,
            date,
            Area,
            ...(req.file ? { profilePicture: { url: req.file.path, filename: req.file.filename } } : {})
        };

        const updatedCollector = await collectorModel.findByIdAndUpdate(collectorId, updateData, { new: true });
        req.user = updatedCollector;
        return res.redirect('/admin/collector');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.postDeleteCollector = async (req, res) => {
    const collectorId = req.params.collectorId;
    const collector = await collectorModel.findById(collectorId)
    await collectorModel.findByIdAndDelete(collectorId);
    await assignModel.deleteMany({ assigneeId: collectorId });
    await binModel.deleteMany({ collector: collector.email });
    return res.redirect('/admin/collector');
};

exports.getUpdateCollector = async (req, res) => {
    const collectorId = req.params.collectorId;
    const collector = await collectorModel.findById(collectorId);
    return res.render('admin/updateCollector', { user: req.user, users: collector });
};

exports.getCollectorList = async (req, res) => {
    const collector = await collectorModel.find({});
    return res.render('admin/collectorList', { user: req.user, collectors: collector });
};

exports.getUserList = async (req, res) => {
    const allUsers = await User.find({});
    return res.render('admin/users', { user: req.user, allUsers: allUsers });
};

exports.getComplaints = async (req, res) => {
    const complain = await complainModel.find({});
    const complainInfo = complain.filter(element => element.status !== 'completed');
    return res.render('admin/complain', { user: req.user, complains: complainInfo });
};

exports.postDeleteComplaint = async (req, res) => {
    try {
        const complainId = req.params.complainId;

        const complain = await complainModel.findById(complainId);
        if (!complain) {
            return res.status(404).send('Complaint not found');
        }

        await User.updateOne(
            { _id: complain.createdBy },
            {
                $pull: {
                    reports: { complain: complain.complain }
                }
            }
        );

        await complainModel.findByIdAndDelete(complainId);
        return res.redirect('/admin/complain');
    } catch (error) {
        console.error('Error deleting complaint:', error);
        res.status(500).send('An error occurred while deleting the complaint');
    }
};

exports.getAssignTask = async (req, res) => {
    const collector = await collectorModel.find({});
    return res.render('admin/assignTask', { user: req.user, collectors: collector });
};

exports.getAssign = async (req, res) => {
    try {
        const collectorId = req.params.collectorId;
        const complain = await complainModel.find({ status: "pending" });
        return res.render('admin/assign', { user: req.user, complain, collectorId });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.postAssign = async (req, res) => {
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
        await complain.save();
        return res.redirect(`/admin/assign/${collectorId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.getDrives = async (req, res) => {
    try {
        const currentDate = getCurrentDate();
        await driveModel.deleteMany({ date: { $lt: currentDate } });
        const drives = await driveModel.find({}).populate('appliedUsers', 'firstname lastname email');
        return res.render('admin/drives', { user: req.user, drives });
    } catch (error) {
        console.error('Error processing drives:', error);
        res.status(500).send('An error occurred while processing drives');
    }
};

exports.postDrives = async (req, res) => {
    const { location, date, number } = req.body;
    const currentDate = getCurrentDate();

    if (date < currentDate) {
        return res.status(400).send('Invalid date');
    } else {
        await driveModel.create({ location, date, number });
    }
    return res.redirect('/admin/drives');
};

exports.getDriveParticipants = async (req, res) => {
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
};

exports.postDeleteDrive = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).send('Unauthorized');
        }

        const driveId = req.params.driveId;
        await driveModel.findByIdAndDelete(driveId);
        return res.redirect('/admin/drives');
    } catch (error) {
        console.error('Error deleting drive:', error);
        res.status(500).send('An error occurred while deleting the drive');
    }
};

exports.getTaskList = async (req, res) => {
    
    const collectorId = req.params.collectorId;
    const task = await assignModel.find({assigneeId: collectorId});
    return res.render('admin/taskAssigned', { task, user: req.user });
};

exports.getAnalytics = async (req, res) => {
    try {
        const analytics = [];
        const collectorId = req.params.collectorId;
        const collector = await collectorModel.findById(collectorId);
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
            analytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).send('Error fetching analytics');
    }
};

exports.getCreateBin = async(req, res) => {
    const collector = await collectorModel.find({});
    return res.render('admin/createbin',{user: req.user, collectors: collector})
}

exports.postCreateBin = async(req, res) => {
    try{
        const { bin, locality, landmark, collector, cyclic, route } = req.body;
        await binModel.create({bin, locality, landmark, collector, cyclic, route});
        return res.redirect('/admin')
    }
    catch(error){
        console.log('Error Occurred: ',error)
        console.error(error)
    }
}

exports.getBin = async(req, res) => {
    try{
        const allBin = await  binModel.find();
        return res.render('admin/bin', { user: req.user, allBin: allBin });
    }catch(error){
        console.log('Error: ', error);
    }
}

exports.getParticularBin = async(req, res) => {
    try{
        const binId = req.params.binID;
        const bin = await binModel.findById(binId)
        const collector = await collectorModel.find({});
        console.log(bin)
        return res.render('admin/updatebin',{user: req.user,  bin: bin, collectors: collector})

    }
    catch(error){
        console.log('Error: ', error);
    }
}

exports.postUpdateBin = async(req, res) => {
    try{
        const { bin, locality, landmark, collector, cyclic, route } = req.body
        const binId = req.params.binID;
        await binModel.findByIdAndUpdate(binId, {bin, locality, landmark, collector, cyclic, route});
        return res.redirect('/admin/bin')
    }catch(error){
        console.log('Error: ', error);
    }
}
exports.logout = (req, res) => {
    res.clearCookie('token').redirect('/');
};

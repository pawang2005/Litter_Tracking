const { collectorModel } = require('../models/collector.js');
const { assignModel } = require('../models/taskAssign');
const { complainModel } = require('../models/complain.js');
const { binModel } = require('../models/bin')

exports.logout = (req, res) => {
    res.clearCookie('token').redirect('/');
};

exports.getHome = (req, res) => {
    res.render('collector/collectorHome', { user: req.user});
}
exports.getProfile = async (req, res) => {
    const user = await collectorModel.findById(req.user.id);
    return res.render('collector/profile', { user: user });
};

exports.getUpdate = async (req, res) => {
    try {
        const task = await assignModel.findById(req.params.taskId);
        const complain = await complainModel.find({ complain: task.task });
        if (!task) {
            return res.status(404).send("Task not found");
        }
        return res.render('collector/collectorStatus', { user: req.user, task: task, complain: complain });
    } catch (error) {
        console.error("Error fetching task:", error);
        return res.status(500).send("Error fetching task");
    }
};

exports.postUpdate = async (req, res) => {
    const { status } = req.body;
    const taskId = req.params.taskId;
    try {
        const updatedTask = await assignModel.findByIdAndUpdate(taskId, { status }, { new: true });
        const ID = updatedTask.complainID;
        await complainModel.findByIdAndUpdate(
            ID,
            { status, isRead: false },
            { new: true }
        );
        const collector = await collectorModel.findById(req.user.id);
        if (status === "completed") {
            const taskCompletedByCollector = collector.taskCompleted + 1;
            await collectorModel.findByIdAndUpdate(req.user.id, { taskCompleted: taskCompletedByCollector });
        }
        if (updatedTask) {
            return res.redirect('/collector/task');
        } else {
            console.log("No task found");
            return res.status(404).send("Task not found");
        }
    } catch (error) {
        console.error("Error updating status:", error);
        return res.status(500).send("Error updating status");
    }
};

exports.getTasks = async (req, res) => {
    try {
        const collector = await collectorModel.findById(req.user.id);
        const tasks = await assignModel.find({ assignee: collector.firstname });
        return res.render('collector/collectorAssigned', { user: req.user, tasks: tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return res.status(500).send("Error fetching tasks");
    }
};

exports.getBin = async(req, res) => {
    try{
        const allBin = await  binModel.find();
        return res.render('collector/bin', { user: req.user, allBin: allBin });
    }catch(error){
        console.log('Error: ', error);
    }
}
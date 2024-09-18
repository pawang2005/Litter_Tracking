const mongoose = require('mongoose')
const driveSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    number: {
        type: Number,
        required: true,
    },
    Applied: { type: Number, default: 0 },
    appliedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const driveModel = mongoose.model('drives', driveSchema);
module.exports = driveModel
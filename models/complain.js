const { Schema, model } = require('mongoose');

const complainSchema = new Schema({
    imageURL: {
        url: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        }
    },
    complain: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true,
    },
    location: [{
        latitude: {
            type: String,
            required: true
        },
        longitude: {
            type: String,
            required: true
        }
    }],
    date: {
        type: Date,
        default: Date.now(), // Use function reference for default value
    },
    status: {
        type: String,
        default: "pending",
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    weight: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const complainModel = model('Complain', complainSchema);

module.exports = { complainModel };

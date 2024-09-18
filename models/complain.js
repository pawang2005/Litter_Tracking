const { Schema, model } = require('mongoose')

const complainSchema = new Schema({
    imageURL: {
        type: String,
        required: true,
        default: false,
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
        default: Date.now(),
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
}, { timestamps: true })

const complainModel = model('complain', complainSchema);

module.exports = { complainModel }
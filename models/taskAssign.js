const {Schema, model} = require('mongoose')

const assignSchema = new Schema({
    assignee: {type: String, required: true},
    assigneeId: {type: String , required: true},
    assigner: {type: String, required: true},
    task: {type: String, required: true},
    status: {type: String, default:"pending",required: true, },
    date: {type: Date, default: Date.now(),},
    complainID: { type: String },
    imageURL:{
        type:String,
        required : true,
        default: false,
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
    address: {
        type:String,
        required: true

    },
    category: {
        type: String,
        required: true,
    },
    weight: {
        type: String,
        required: true,
    }
}, {timestamps: true})

const assignModel = model('Task', assignSchema)

module.exports = {assignModel,}
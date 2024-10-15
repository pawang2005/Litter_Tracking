const { Schema, model } = require('mongoose');

const binSchema = new Schema({
    bin: { type: String, required: true },
    locality: { type: String, required: true },
    landmark: { type: String, required: true },
    collector: { type: String, required: true },
    cyclic: { type: String, required: true },
    route: { type: String, required: true },
})

const binModel = model('Bin', binSchema);

module.exports = {binModel};
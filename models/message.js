const mongoose = require('mongoose');

const Schema = mongoose.Schema

const messageSchema = new Schema({
    email: String,
    message: String,

}, {
    timestamps: true
})

module.exports.Message = mongoose.model('messages', messageSchema)
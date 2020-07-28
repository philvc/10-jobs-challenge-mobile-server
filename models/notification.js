const mongoose = require('mongoose')


const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    gameId: String,
    label: String,
    isRead: { type: Boolean, default: false },
    recipientId: String,
}, {
    timestamps: true
})

module.exports.Notification = mongoose.model('notifications', notificationSchema)



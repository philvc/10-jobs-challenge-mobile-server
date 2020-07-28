const mongoose = require('mongoose');

const Schema = mongoose.Schema

const gameSchema = new Schema({
    title: String,
    recruiterId: String,
    applicantId: String,
    topicArn: String,
    people: { type: [String], default: [''] },
}, {
    timestamps: true
})

module.exports.Game = mongoose.model('games', gameSchema)
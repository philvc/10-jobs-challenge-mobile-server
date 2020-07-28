const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    playerName: { type: String, default: '' },
}, {
    timestamps: true
})

module.exports.Player = mongoose.model('players', PlayerSchema)
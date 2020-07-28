const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const jobsSchema = new Schema({
    missionId: String,
    gameId: String,
    url: { type: String, default: '' },
    name: { type: String, default: '' },
    rank: Number,
    isAccepted: { type: Boolean, default: false },
    applicationProofRef: { type: String, default: '' },
    isComplete: { type: Boolean, default: false },
    isApplied: { type: Boolean, default: false },
    isSelected: { type: Boolean, default: false },
    mission10JobsId: { type: String, default: '' },
    missionJobApplicationId: { type: String, default: '' },
}, {
    timestamps: true
})

module.exports.Job = mongoose.model('jobs', jobsSchema)
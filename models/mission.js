const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const missionSchema = new Schema({
    status: { type: String, enum: ['pending', 'completed', 'new'], default: 'new' },
    isLocked: { type: Boolean, default: false },
    isUnderReview: { type: Boolean, default: false },
    type: String,
    gameId: { type: String, default: null },
    isEvaluated: { type: Boolean, default: false },
    score: { type: Number, default: null },
    selectedJob: { type: String, default: null },
    time: { type: String, default: '' },
    progress: { type: Number, default: null },
}, {
    timestamps: true
})

module.exports.Mission = mongoose.model('missions', missionSchema)
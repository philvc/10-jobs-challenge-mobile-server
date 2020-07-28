const mongoose = require('mongoose')

const Schema = mongoose.Schema

const documentSchema = new Schema({
    fileName: { type: String, required: true },
    extension: String,
    jobId: String,
    fileRef: { type: String, required: false }, // S3 Path
    thumbnailRef: { type: String, required: false }, // S3 Path
}, {
    timestamps: true
})

module.exports.Document = mongoose.model('documents', documentSchema)
const mongoose = require("mongoose");

module.exports.mongodbConnection = () => {
    mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment-game',
        { useNewUrlParser: true, useFindAndModify: false }
    )
    const db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        // we're connected!
        console.log(`we are connected to the mongodb ${process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment-game'}`)
    });

};

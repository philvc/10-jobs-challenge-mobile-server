const AWS = require('aws-sdk')

const awsConfig = require('../awsConfig');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
module.exports = new AWS.SNS({
    region: awsConfig.region,
})
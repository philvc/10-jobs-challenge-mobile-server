const AWS = require('aws-sdk')

const awsConfig = require('./awsConfig');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const s3 = new AWS.S3({
    region: awsConfig.region,
})

module.exports = {
    getSignedPutUrl: (
        bucketName,
        fileName,
        expires,
        contentType,
    ) => {
        const params = {
            Key: fileName,
            Bucket: bucketName,
            Expires: expires,
            ACL: 'bucket-owner-full-control',
            ContentType: contentType,
            ServerSideEncryption: 'AES256',
        };
        // getSignedUrl doesn't support .promise()
        return new Promise((resolve, reject) =>
            s3.getSignedUrl('putObject', params, (err, url) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(url);
            }),
        );

    },
    getSignedUrl: (
        bucketName,
        fileName,
        expires,
    ) => {
        const params = {
            Key: fileName,
            Bucket: bucketName,
            Expires: expires,
        };
        // getSignedUrl doesn't support .promise()
        return new Promise((resolve, reject) =>
            s3.getSignedUrl('getObject', params, (err, url) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(url);
            }),
        );
    }
}
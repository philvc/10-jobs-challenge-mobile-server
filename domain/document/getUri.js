const awsConfig = require('../../core/aws/awsConfig')
const S3Uri = require('../../core/aws/s3Uri')

module.exports.getUri = (
    filePath,
    bucketName = awsConfig.bucketName,
) => {
    if (!filePath) {
        return null;
    }
    const filepath = filePath.toLowerCase();

    return new S3Uri('s3', filepath, bucketName);
};


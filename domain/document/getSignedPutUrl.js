const s3 = require('../../core/aws/s3')

module.exports.getSignedPutUrl = async (uri, contentType) => {
    if (uri.scheme !== 's3') {
        // fs
        const debugFolder = path.join(config.debug.s3LocalPath, config.aws.s3.documentsBucketName);
        const filename = uri.path.replace(debugFolder, '');
        return Promise.resolve(`http://localhost:3000/debug/docs/upload${filename}`);
    }
    return s3.getSignedPutUrl(uri.host, uri.path, 900, contentType);
}
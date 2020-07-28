const s3 = require('../../core/aws/s3')

module.exports = (uri) => {
    if (uri.scheme !== 's3' && config.stage === 'local') {
        // fs
        return Promise.resolve(`http://localhost:3000/debug/docs?path=${uri.path}`);
    }
    // bucketName: string,
    // fileName: string,
    return s3.getSignedUrl(uri.host, uri.path, 900);
};
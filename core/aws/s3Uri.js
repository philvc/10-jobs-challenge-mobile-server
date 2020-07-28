const URI = require('uri-js')

module.exports = class S3Uri {
  scheme;
  // bucketName;
  path;
  host;

  static null = new S3Uri('', '');

  constructor(scheme, path, host) {
    this.scheme = scheme;
    // this.bucketName = bucketName;
    this.path = path;
    this.host = host;
  }

  toString() {
    if (this.scheme === 's3') {
      return URI.serialize({
        scheme: this.scheme,
        host: this.host,
        path: this.path
      });
    }
    return `${this.scheme}://${this.path}`.replace(/\\/g, '/');
  }

  static parse(uri) {
    if (!uri) {
      return S3Uri.null;
    }
    const parsedUri = URI.parse(uri);
    const s3Uri = new S3Uri(parsedUri.scheme, parsedUri.path, parsedUri.host);
    if (s3Uri.scheme === 's3') {
      s3Uri.path = s3Uri.path.substr(1, s3Uri.path.length - 1);
    }
    return s3Uri;
  }
}

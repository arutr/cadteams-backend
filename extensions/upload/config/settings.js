process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const dotenv = require('dotenv').config({
  path: `.${process.env.NODE_ENV}.env`,
});

if (process.env.NODE_ENV !== 'development') {
  module.exports = {
    provider: 'aws-s3',
    providerOptions: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      params: {
        Bucket: process.env.AWS_S3_BUCKET,
      },
    },
  };
} else {
  module.exports = {};
}

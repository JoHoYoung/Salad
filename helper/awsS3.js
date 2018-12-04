const AWSaccount = require('../config/awsaccount')
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const profile = {
    accessKeyId: AWSaccount.AWS_S3_ACCESS_KEY,
    secretAccessKey: AWSaccount.AWS_S3_SECRET_KEY,
    region: AWSaccount.AWS_SE_REGION
}

aws.config.update(profile)

const s3 = new aws.S3();

const storageS3 = multerS3({
    s3: s3,
    bucket: 'depromeet-salad',
    acl: 'public-read',
    key: function (req, file, callback) {
        const filename = "salad" + '-' + Date.now();
        callback(null, filename);
    }
});

module.exports.uploadSingle = multer({storage: storageS3}).single('image')
module.exports.uploadArray = multer({storage: storageS3}).array('image', 6)

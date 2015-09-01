var async = require('async');
var AWS = require('aws-sdk');
var gm = require('gm').subClass({ imageMagick: true });
var util = require('util');

var WIDTH = 60;
var THUMBNAIL_IMAGE_TYPE = 'jpg';


var s3 = new AWS.S3();

exports.handler = function(event, context) {
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
    var bucket = event.Records[0].s3.bucket.name;
    var srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    var dstKey = srcKey.replace("originals/", "thumbnails/");

    if (srcKey === dstKey) {
        console.error('upload key ' + srcKey + ' and destination key ' + dstKey + ' are same.');
        return;
    };

    async.waterfall([
        function download(next) {
            s3.getObject({
                    Bucket: bucket,
                    Key: srcKey
                },
                next);
            },
        function transform(response, next) {
            gm(response.Body).autoOrient().resize(null, WIDTH).toBuffer(THUMBNAIL_IMAGE_TYPE, function(err, buffer) {
                if (err) {
                    next(err);
                } else {
                    next(null, response.ContentType, buffer);
                }
            });
        },
        function upload(contentType, data, next) {
            s3.putObject({
                    Bucket: bucket,
                    Key: dstKey,
                    Body: data,
                    ACL: 'public-read',
                    ContentType: contentType
                },
                next);
            }
        ], function (err) {
            if (err) {
                console.error(
                    'Unable to resize ' + bucket + '/' + srcKey +
                    ' and upload to ' + bucket + '/' + dstKey +
                    ' due to an error: ' + err
                );
            } else {
                console.log(
                    'Successfully resized ' + bucket + '/' + srcKey +
                    ' and uploaded to ' + bucket + '/' + dstKey
                );
            }

            context.done();
        }
    );
};

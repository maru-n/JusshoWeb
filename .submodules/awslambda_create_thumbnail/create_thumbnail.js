var async = require('async');
var AWS = require('aws-sdk');
var gm = require('gm').subClass({ imageMagick: true });
var util = require('util');
var mongodb = require('mongodb');

var S3_URL_PREFIX = "https://s3-ap-northeast-1.amazonaws.com/";
var WIDTH = 60;
var THUMBNAIL_IMAGE_TYPE = 'jpg';

// map bucket -> mongo_url
var MONGO_URL_MAP = {
    'marun.test': 'mongodb://jusshoweb:QqZnHrMhGLT4RmGn@jussho.top/jusshoweb_develop',  // develop
    'jusshoweb' : 'mongodb://jusshoweb:QqZnHrMhGLT4RmGn@jussho.top/jusshoweb'  // production
}


var s3 = new AWS.S3({apiVersion: '2006-03-01'});

exports.handler = function(event, context) {
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
    var bucket = event.Records[0].s3.bucket.name;
    var mongoUrl = MONGO_URL_MAP[bucket];
    var originalKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    var thumbnailKey = originalKey.replace("originals/", "thumbnails/");
    var originalUrl = S3_URL_PREFIX + bucket + "/" + event.Records[0].s3.object.key;
    var thumbnailUrl = originalUrl.replace("originals/", "thumbnails/");
    var photoId = originalKey.split('-')[0].replace(/^[\w\/]*\//g, "");

    console.log("Starting convert of photo #" + photoId);

    if (originalKey === thumbnailKey) {
        console.error('upload key ' + originalKey + ' and destination key ' + thumbnailKey + ' are same.');
        return;
    };

    async.waterfall([
        function download(next) {
            s3.getObject({
                Bucket: bucket,
                Key: originalKey
            },
            next);
        },
        function transform(s3GetResponse, next) {
            gm(s3GetResponse.Body).autoOrient().resize(null, WIDTH).toBuffer(THUMBNAIL_IMAGE_TYPE, function(err, buffer) {
                if (err) {
                    next(err);
                } else {
                    next(null, s3GetResponse, buffer);
                }
            });
        },
        function upload(s3GetResponse, data, next) {
            s3.putObject({
                Bucket: bucket,
                Key: thumbnailKey,
                Body: data,
                ACL: 'public-read',
                ContentType: s3GetResponse.ContentType
            },function(error, data){
                if (error) {
                    next(error);
                } else {
                    next(null, s3GetResponse);
                }
            });
        },
        function getExif(s3GetResponse, next) {
            gm(s3GetResponse.Body).identify(function(err, data){
                if (err) {
                    next(err);
                } else {
                    next(null, data);
                }
            });
        },
        function connectDB(exifData, next) {
            mongodb.MongoClient.connect(mongoUrl, function(err, database) {
                next(err, database, exifData);
            });
        },
        function insertPhotoDocument(db, exifData, next) {
            var photos = db.collection("photos");
            var fields = {
                available: true,
                original: {
                    url: originalUrl,
                    s3Key: originalKey
                },
                thumbnail: {
                    url: thumbnailUrl,
                    s3Key: thumbnailKey,
                },
                size: exifData.size
            }
            console.log("Updating photo document with new fields:\n", util.inspect(fields, {depth: 3}));
            photos.update({_id: photoId}, {$set: fields}, next);
        }],
        function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log(
                    'Successfully resized ' + bucket + '/' + originalKey +
                    ' and uploaded to ' + bucket + '/' + thumbnailKey
                    );
            }
            context.done();
        }
        );
};

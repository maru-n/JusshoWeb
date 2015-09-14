var async = require('async');
var AWS = require('aws-sdk');
var gm = require('gm').subClass({ imageMagick: true });
var util = require('util');
var mongodb = require('mongodb');

var S3_URL_PREFIX = "https://s3-ap-northeast-1.amazonaws.com/";
var S3_ORIGINAL_FOLDER = "originals/"
var S3_THUMBNAILS_FOLDER = "thumbnails/"
var S3_MEDIUM_FOLDER = "mediums/"
var THUMBNAIL_HEIGHT = 60;
var MEDIUM_MAX_SIZE = 2000;

var IMAGE_TYPE = 'jpg';

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
    var thumbnailKey = originalKey.replace(S3_ORIGINAL_FOLDER, S3_THUMBNAILS_FOLDER);
    var mediumKey = originalKey.replace(S3_ORIGINAL_FOLDER, S3_MEDIUM_FOLDER);

    var originalUrl = S3_URL_PREFIX + bucket + "/" + event.Records[0].s3.object.key;
    var thumbnailUrl = originalUrl.replace(S3_ORIGINAL_FOLDER, S3_THUMBNAILS_FOLDER);
    var mediumUrl = originalUrl.replace(S3_ORIGINAL_FOLDER, S3_MEDIUM_FOLDER);

    var photoId = originalKey.split('-')[0].replace(/^[\w\/]*\//g, "");

    console.log("Photo #" + photoId);

    async.waterfall([
        function download(next) {
            s3.getObject({
                Bucket: bucket,
                Key: originalKey
            },
            next);
        },
        function manipurateImage(s3GetResponse, next) {
            async.parallel([
                function exif(callback) {
                    gm(s3GetResponse.Body).identify(callback);
                },
                function thumbnail(callback) {
                    gm(s3GetResponse.Body)
                    .autoOrient()
                    .resize(null, THUMBNAIL_HEIGHT)
                    .toBuffer(IMAGE_TYPE, function(error, buffer) {
                        if (error) {
                            callback(error);
                        } else {
                            s3.putObject({
                                Bucket: bucket,
                                Key: thumbnailKey,
                                Body: buffer,
                                ACL: 'public-read',
                                ContentType: s3GetResponse.ContentType
                            }, callback);
                        }
                    });
                },
                function medium(callback) {
                    gm(s3GetResponse.Body)
                    .autoOrient()
                    .resize(MEDIUM_MAX_SIZE, MEDIUM_MAX_SIZE)
                    .toBuffer(IMAGE_TYPE, function(error, buffer) {
                        if (error) {
                            callback(error);
                        } else {
                            s3.putObject({
                                Bucket: bucket,
                                Key: mediumKey,
                                Body: buffer,
                                ACL: 'public-read',
                                ContentType: s3GetResponse.ContentType
                            }, callback);
                        }
                    });
                },
            ], function(error, results) {
                if (error) {
                    next(error);
                } else {
                    next(null, results[0]);
                }
            });
        },
        function connectDB(exifData, next) {
            mongodb.MongoClient.connect(mongoUrl, function(error, database) {
                next(error, database, exifData);
            });
        },
        function insertPhotoDocument(db, exifData, next) {
            console.log("Exif data:", exifData);
            var photoDateTime;
            try {
                var dt = exifData.Properties['exif:DateTimeOriginal'].split(/[:\s]/);
                photoDateTime = new Date(dt[0], dt[1]-1, dt[2], dt[3], dt[4], dt[5]);
            } catch (e) {
                photoDateTime = null;
            }
            var size, thumbnailSize, mediumSize;
            try {
                size = exifData.size;
                thumbnailSize = {
                    width: Math.floor(size.width * THUMBNAIL_HEIGHT / size.height),
                    height: THUMBNAIL_HEIGHT
                }
                mediumSize = {
                    width: Math.floor(size.width > size.height ? MEDIUM_MAX_SIZE : size.width * MEDIUM_MAX_SIZE / size.height),
                    height: Math.floor(size.width > size.height ? size.height * MEDIUM_MAX_SIZE / size.width : MEDIUM_MAX_SIZE)
                }
            } catch (error) {
                console.error(error);
                size = null;
                thumbnailSize = null;
            }
            var fields = {
                available: true,
                size: size,
                photoDateTime: photoDateTime,
                original: {
                    url: originalUrl,
                    s3Key: originalKey,
                    size: size
                },
                medium: {
                    url: mediumUrl,
                    s3Key: mediumKey,
                    size: mediumSize
                },
                thumbnail: {
                    url: thumbnailUrl,
                    s3Key: thumbnailKey,
                    size: thumbnailSize
                }
            }
            console.log("New Photo document fields:", util.inspect(fields, {depth: 3}));
            var photos = db.collection("photos");
            photos.update({_id: photoId}, {$set: fields}, next);
        }],
        function (error) {
            if (error) {
                console.error(error);
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

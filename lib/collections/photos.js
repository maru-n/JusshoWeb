var SLINGSHOT_PHOTOS_DIRECTIVE = "photos";
var S3_ORIGINALS_FOLDER = "originals/";
var S3_THUMBNAILS_FOLDER = "thumbnails/";

Slingshot.fileRestrictions(SLINGSHOT_PHOTOS_DIRECTIVE, {
    allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
    maxSize: null
});

if (Meteor.isServer) {
    Slingshot.createDirective(SLINGSHOT_PHOTOS_DIRECTIVE, Slingshot.S3Storage, {
        bucket: Meteor.settings.AWSS3Bucket,
        acl: "public-read",
        authorize: function (file, metaContext) {
            if (!this.userId) {
                var message = "Please login before posting files";
                throw new Meteor.Error("Login Required", message);
            }
            return true;
        },
        key: function (file, metaContext) {
            return S3_ORIGINALS_FOLDER + metaContext.operationId + "/" + metaContext.photoId + "-" + file.name;
        }
    });
}


Photos = new Mongo.Collection('photos');

Photos.allow({
    insert: function (userId, doc) {
        return userId;
    },
    update: function (userId, doc, fields, modifier) {
        return userId;
    },
    remove: function (userId, doc) {
        return userId;
    },
});

var LAMBDA_RESULT_WAITING_TIME = 22000

Photos.insertFileBelongedOperation = function(file, targetOperationId, callback) {
    async.waterfall([
        function insertPhoto(next) {
            // download data will be set by AWS Lambda function.
            Photos.insert({
                name: file.name,
                createdAt: new Date(),
                uploadedBy: Meteor.userId(),
                operation: targetOperationId,
                available: false
            }, next);
        },
        function uploadFile(photoId, next) {
            var uploader = new Slingshot.Upload(SLINGSHOT_PHOTOS_DIRECTIVE, {
                operationId: targetOperationId,
                photoId: photoId
            });
            uploader.send(file, function(error, downloadUrl){
                next(error, photoId);
            });
        },
        function checkLambdaResult(photoId, next) {
            var handle = Photos.find({_id:photoId, available:true}).observe({
                added: function (item) {
                    clearTimeout(timer);
                    handle.stop();
                    next(null, photoId)
                }
            });
            var timer = setTimeout(function() {
                handle.stop();
                var error =  new Meteor.Error("Lambda error",
                "Waiting time out for checking Lambda function complete.");
                next(error);
            }, LAMBDA_RESULT_WAITING_TIME);
        },
    ], callback);
}

Photos.findOperationPhotos = function(operation) {
    var photos = this.find({
        operation: operation._id,
        available: true
    },{
        fields: {
            meta: 0,
        }
    });
    return photos
}

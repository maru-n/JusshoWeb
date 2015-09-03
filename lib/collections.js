Operations = new Mongo.Collection('operations');

Operations.defaultName = function() {
    var date = new Date();
    for (var i = 1;; i++) {
        var nextName = date.toISOString().split('T')[0] + 'の作戦' + i;
        if(!Operations.findOne({name: nextName})) {
            return nextName;
        }
    }
};

Operations.allow({
    insert: function (userId, doc) {
        return (userId && doc.owner === userId);
    },
    update: function (userId, doc, fields, modifier) {
        return _.contains(fields, "photos") || (userId && doc.owner === userId) || Roles.userIsInRole(userId, 'admin');
    },
    remove: function (userId, doc) {
        return (userId && doc.owner === userId) || Roles.userIsInRole(userId, 'admin');
    },
});


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

Photos.insertFileBelongedOperation = function(file, targetOperationId, callback) {
    var photoId = Photos.insert({
        name: file.name,
        createdAt: new Date(),
        uploadedBy: Meteor.userId()
    });

    var uploader = new Slingshot.Upload(SLINGSHOT_PHOTOS_DIRECTIVE, {
        operationId: targetOperationId,
        photoId: photoId
    });

    uploader.send(file, function (error, downloadUrl) {
        if (error) {
            callback(error, null);
        } else {
            var thumbnailUrl = downloadUrl.replace(S3_ORIGINALS_FOLDER, S3_THUMBNAILS_FOLDER);
            Photos.update(photoId, {
                $set: {
                    original: {
                        url: downloadUrl,
                        s3Key: downloadUrl.split('/').slice(4).join('/')
                    },
                    thumbnail: {
                        url: thumbnailUrl,
                        s3Key: thumbnailUrl.split('/').slice(4).join('/')
                    }
                }
            }, function(error, updatedNum){
                if (error) {
                    callback(error, null);
                } else {
                    Operations.update(targetOperationId, {
                        $addToSet: {photos: photoId},
                    }, function(error, objectNum){
                        if (error) {
                            callback(error, null);
                        }else{
                            callback(null, photoId);
                        }
                    });
                }
            });
        }
    });
}

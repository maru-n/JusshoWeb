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
var S3_ORIGINALS_FOLDER = "originals";
var S3_THUMBNAILS_FOLDER = "thumbnails";

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
            return S3_ORIGINALS_FOLDER + "/" + metaContext.operationId + "/" + file.name;
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

Photos.insertFile = function(file, targetOperationId) {
    var uploader = new Slingshot.Upload(SLINGSHOT_PHOTOS_DIRECTIVE, {operationId: targetOperationId});

    uploader.send(file, function (error, downloadUrl) {
        Session.set("uploaded_file_num", Session.get("uploaded_file_num")+1);
        if (error) {
            //console.error(uploader.xhr.response)
            //console.error(error);
            var errorFiles = Session.get("upload_error_files");
            errorFiles.push(file.name);
            Session.set("upload_error_files", errorFiles);
        } else {
            var photoId = Photos.insert({
                createdAt: new Date(),
                uploadedBy: Meteor.userId(),
                original: {
                    url: downloadUrl,
                    s3Key: S3_ORIGINALS_FOLDER+"/"+targetOperationId+"/"+file.name,
                },
                thumbnail: {
                    url: downloadUrl.replace("/"+S3_ORIGINALS_FOLDER+"/", "/"+S3_THUMBNAILS_FOLDER+"/"),
                    s3Key: S3_THUMBNAILS_FOLDER+"/"+targetOperationId+"/"+file.name,
                }
            });
            Operations.update(targetOperationId, {
                $addToSet: {photos: photoId},
            });
        }
    });
}

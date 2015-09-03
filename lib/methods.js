Meteor.methods({
    createOperation: function(operationName) {
        if (!operationName) {
            operationName = Operations.defaultName();
        };
        Operations.insert({
            name: operationName,
            owner: Meteor.userId(),
            createdAt: new Date(),
        })
    },

    deleteOperation: function (operationId) {
        Meteor.call('deleteAllPhotos', operationId);
        Operations.remove(operationId);
    },

    uploadFilesBelongedOperation: function(files, operation) {
        console.log(files);
        Session.set("upload_operation", operation.name);
        Session.set("uploading_file_num", files.length);
        Session.set("uploaded_file_num", 0);
        Session.set("upload_failed_files", []);
        _.each(files, function (file) {
            Photos.insertFileBelongedOperation(file, operation._id, function(error, objectId){
                Session.set("uploaded_file_num", Session.get("uploaded_file_num")+1);
                if (error) {
                    console.error(error);
                    var errorFiles = Session.get("upload_failed_files").concat([file]);
                    Session.set("upload_failed_files", errorFiles);
                }else{

                }
            });
        });
    },

    deleteAllPhotos: function (operationId) {
        var operation = Operations.findOne(operationId);
        if (operation.photos) {
            if (Meteor.isServer) {
                var s3 = new AWS.S3();
                var param = {
                    Bucket: Meteor.settings.AWSS3Bucket,
                    Delete: {Objects: []}
                };
                var photos = Photos.find({
                    _id: {$in: operation.photos}}, {
                        fields: {
                            'original.s3Key':1,
                            'thumbnail.s3Key':1,
                        }
                    }).fetch();
                _.forEach(photos, function(photo){
                    if (photo.original && photo.original.s3Key) {
                        param.Delete.Objects.push({
                            Key: photo.original.s3Key
                        });
                    }
                    if (photo.thumbnail && photo.thumbnail.s3Key) {
                        param.Delete.Objects.push({
                            Key: photo.thumbnail.s3Key
                        });
                    }
                });
                s3.deleteObjects(param, function(err, data) {
                    if (err) {
                        console.error(err);
                    }
                });
            }

            Photos.remove({
                _id: {$in: operation.photos}
            });
        }

        Operations.update(operationId, {
            $unset: { photos: "" }
        });
    }
});

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
                    param.Delete.Objects.push({
                        Key: photo.original.s3Key
                    });
                    param.Delete.Objects.push({
                        Key: photo.thumbnail.s3Key
                    });
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

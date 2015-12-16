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
        if (Meteor.isServer) {
            var s3 = new AWS.S3({apiVersion: '2006-03-01'});
            var param = {
                Bucket: Meteor.settings.AWSS3Bucket,
                Delete: {Objects: []}
            };
            Photos.find({operation:operationId}).forEach(function(photo){
                console.log(photo);
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
                if (photo.medium && photo.medium.s3Key) {
                    param.Delete.Objects.push({
                        Key: photo.medium.s3Key
                    });
                }
            });
            s3.deleteObjects(param, function(err, data) {
                if (err) {
                    console.error(err);
                }
            });
        }
        Photos.remove({operation:operationId})
    }
});

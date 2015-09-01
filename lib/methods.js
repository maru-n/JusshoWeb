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

    createPhoto: function(originalUrl, operationId) {
        photoId = Photos.insert({
            createdAt: new Date(),
            uploadedBy: Meteor.userId(),
            original: {
                url: originalUrl
            },
            thumbnail: {
                url: originalUrl.replace("/originals/", "/thumbnails/")
            }
        });
        Operations.update(operationId, {
            $addToSet: {photos: photoId}
        });
    },

    deleteAllPhotos: function (operationId) {
        var operation = Operations.findOne(operationId);
        if (operation.photos) {
            Photos.remove({
                _id: {
                    $in: operation.photos
                }
            });
        }
        Operations.update(operationId, {
            $unset: { photos: "" }
        });
    },
});

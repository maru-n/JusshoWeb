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

    createPhoto: function(file, operationId) {
        var newFile = new FS.File(file);
        newFile.metadata = {
            owner: Meteor.userId()
        }
        var fileObj = Photos.insert(newFile);
        Operations.update(operationId, {
            $addToSet: {photos: fileObj._id}
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
        Operations.update({
            _id: operationId
        },{
            $unset: { photos: "" }
        });
    }
});

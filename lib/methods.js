Meteor.methods({
    deleteOperation: function (operationId) {
        Meteor.call('deleteAllPhotos', operationId);
        Operations.remove(operationId);
    },
    deleteAllPhotos: function (operationId) {
        var operation = Operations.findOne(operationId);
        Photos.remove({
            _id: {
                $in: operation.photos
            }
        });
        Operations.update({
            _id: operationId
        },{
            $unset: { photos: "" }
        });
    }
});

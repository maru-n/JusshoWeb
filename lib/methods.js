Meteor.methods({
    deleteOperation: function (operationId) {
        Photos.remove({
            _id: {
                $in: Operations.findOne(operationId).photos
            }
        });
        Operations.remove(operationId);
    },
});

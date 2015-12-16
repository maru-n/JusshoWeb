Meteor.publish("users", function () {
    return Meteor.users.find({},{
        fields: {'username': 1}
    });
});

Meteor.publish("operations", function () {
    var operations = Operations.find();
    return operations
});

Meteor.publish('operationViewData', function(operation) {
    Counts.publish(this, 'operationPhotoCount'+operation._id, Photos.findOperationPhotos(operation), {
        noWarnings: true
    });
    var coverPhoto = Photos.findCoverPhoto(operation);
    return coverPhoto
});

Meteor.publish('operationPhotos', function(operation){
    return Photos.findOperationPhotos(operation);
});

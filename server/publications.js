Meteor.publish("users", function () {
    return Meteor.users.find({},
        {fields: {'username': 1}
    });
});

Meteor.publish("operations", function () {
    var self = this;
    var operations = Operations.find();
    var photoIds = []
    operations.forEach(function(o){
        try {
            var p = Photos.findOne({
                operation:o._id,
                available:true
            });
            photoIds.push(p._id);
        } catch (e) {}
    });
    var coverPhotos = Photos.find({_id: {$in: photoIds}});
    return [operations, coverPhotos]
});

Meteor.publish('operationPhotoCount', function(operation) {
    Counts.publish(this, 'operationPhotoCount'+operation._id, Photos.findOperationPhotos(operation), {
        noWarnings: true
    });
});

Meteor.publish('operationPhotos', function(operation){
    return Photos.findOperationPhotos(operation);
});

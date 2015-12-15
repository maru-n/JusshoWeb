Meteor.publish("users", function () {
    return Meteor.users.find({},
        {fields: {'username': 1}
    });
});

Meteor.publish("operations", function () {
    return Operations.find();
});

Meteor.publish('operationPhotos', function(operation){
    var photos = Photos.find({
        operation: operation._id,
        available: true
    },{
        fields: {
            meta: 0,
        }
    });
    return photos;
});

Meteor.publish("coverPhotos", function(){
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
    return [
        operations,
        Photos.find({_id: {$in: photoIds}})
    ]
});


Meteor.publish("photos", function () {
    return Photos.find({
        available: true
    },{
        fields: {
            meta: 0,
        }
    });
});

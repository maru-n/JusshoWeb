Meteor.publish("allUserName", function () {
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

Meteor.publish("photos", function () {
    return Photos.find({
        available: true
    },{
        fields: {
            meta: 0,
        }
    });
});

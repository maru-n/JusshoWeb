Meteor.publish("allUserName", function () {
    return Meteor.users.find({},
        {fields: {'username': 1}
    });
});

Meteor.publish("operations", function () {
    return Operations.find();
});

Meteor.publish("photos", function () {
    return Photos.find();
});

Meteor.publish("uploadTasks", function() {
    return UploadTasks.find();
});


Meteor.publish("operations", function () {
    return Operations.find();
});

Meteor.publish("photos", function () {
    return Photos.find();
});

Meteor.publish("uploadTasks", function() {
    return UploadTasks.find();
});


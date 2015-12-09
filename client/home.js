Meteor.subscribe("operations");
Meteor.subscribe("allUserName");
Meteor.subscribe("coverPhotos");

Template.home.helpers({
    operations: function() {
        var operations = Operations.find({}, {
            sort: {createdAt: -1}
        });
        return operations
    },
});

Template.home.events({
});

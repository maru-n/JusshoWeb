Meteor.subscribe("operations");
Meteor.subscribe("allUserName");

Template.operationList.helpers({
    operations: function() {
        var operations = Operations.find({}, {
            sort: {createdAt: -1}
        });
        return operations
    },
    operationDefaultName: function() {
        return Operations.defaultName();
    },

    ownerName: function() {
        var owner = Meteor.users.findOne(this.owner);
        if (owner) {
            return owner.username;
        };
    },

    photoCount: function() {
        if (!this.photos) {
            return 0;
        };
        return this.photos.length;
    }
});

Template.operationList.events({
    'submit .new-operation': function(event) {
        event.preventDefault();
        var text = event.target.text.value;
        Meteor.call("createOperation", text);
        event.target.text.value = "";
    },
});

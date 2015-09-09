Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
});

Meteor.subscribe("operations");
Meteor.subscribe("allUserName");

Template.home.helpers({
    isAdmin: function() {
        return Roles.userIsInRole(Meteor.userId(), 'admin');
    }
});

Template.operationList.helpers({
    operations: function() {
        return Operations.find({}, {
            sort: {
                createdAt: -1
            }
        });
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
        var photos = Photos.find({
            _id: {$in: this.photos},
            available: true
        });
        return photos.count();
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

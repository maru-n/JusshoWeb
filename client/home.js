Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
});

Meteor.subscribe("operations");

Template.home.helpers({
});

Template.operationList.helpers({
    operations: function() {
        return Operations.find({},{
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

Meteor.subscribe("users");
Meteor.subscribe("operations");


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


Template.newOperation.events({
    'submit .new-operation': function(event) {
        event.preventDefault();
        var text = event.target.text.value;
        Meteor.call("createOperation", text);
        event.target.text.value = "";
    },
});

Template.navigationMenu.helpers({
    isAdmin: function() {
        return Roles.userIsInRole(Meteor.userId(), 'admin');
    }
});

Template.navigationMenu.events({
    'click .log-out-button': function(event) {
        Meteor.logout();
    },
});

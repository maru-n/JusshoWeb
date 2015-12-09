Template.navigationMenu.helpers({
    isAdmin: function() {
        return Roles.userIsInRole(Meteor.userId(), 'admin');
    }
});

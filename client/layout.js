Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
});

Template.layout.helpers({
    isAdmin: function() {
        return Roles.userIsInRole(Meteor.userId(), 'admin');
    }
});

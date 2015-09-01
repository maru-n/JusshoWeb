Meteor.startup(function () {
    if (Meteor.users.find().count() === 0) {
        var adminUserId = Accounts.createUser({
            username: Meteor.settings.adminUserName,
            password: Meteor.settings.adminUserPassword,
            email: Meteor.settings.adminUserEmail
        });
        Roles.addUsersToRoles(adminUserId, ['admin'])

        var defaultUsers = Meteor.settings.defaultUsers;
        _.each(defaultUsers, function (user) {
            Accounts.createUser({
                username: user.name,
                password: user.password,
                email: user.email
            });
        });
    }
});


Slingshot.createDirective("photos", Slingshot.S3Storage, {
    bucket: "marun.test",
    acl: "public-read",
    authorize: function () {
        if (!this.userId) {
            var message = "Please login before posting files";
            throw new Meteor.Error("Login Required", message);
        }
        return true;
    },
    key: function (file) {
        return "images/" + file.name;
    }
});

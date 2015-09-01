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

AWS.config.update({
    accessKeyId: Meteor.settings.AWSAccessKeyId,
    secretAccessKey: Meteor.settings.AWSSecretAccessKey,
    region: Meteor.settings.AWSRegion,
});


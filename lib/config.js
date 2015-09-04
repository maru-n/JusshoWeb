Accounts.config({
    forbidClientAccountCreation: true,
});

AdminConfig = {
    userSchema: new SimpleSchema({
        'username': {
            type: String,
        }
    })
}


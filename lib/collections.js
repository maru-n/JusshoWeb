Operations = new Mongo.Collection('operations');
Operations.defaultName = function() {
    var date = new Date();
    for (var i = 1;; i++) {
        var nextName = date.toISOString().split('T')[0] + 'の作戦' + i;
        if(!Operations.findOne({name: nextName})) {
            return nextName;
        }
    }
};

Operations.allow({
    insert: function (userId, doc) {
        return (userId && doc.owner === userId);
    },
    update: function (userId, doc, fields, modifier) {
        return _.contains(fields, "photos") || (userId && doc.owner === userId) || Roles.userIsInRole(userId, 'admin');
    },
    remove: function (userId, doc) {
        return (userId && doc.owner === userId) || Roles.userIsInRole(userId, 'admin');
    },
});

Photos = new Mongo.Collection('photos');
Slingshot.fileRestrictions("photos", {
    allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
    maxSize: null
});

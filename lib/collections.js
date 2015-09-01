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

Slingshot.fileRestrictions("photos", {
    allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
    maxSize: null
});
Photos = new Mongo.Collection('photos');
Photos.insertFile = function(file, targetOperationId) {
    var uploader = new Slingshot.Upload("photos", {operationId: targetOperationId});

    uploader.send(file, function (error, downloadUrl) {
        Session.set("uploaded_file_num", Session.get("uploaded_file_num")+1);
        if (error) {
            //console.error(uploader.xhr.response)
            //console.error(error);
            var errorFiles = Session.get("upload_error_files");
            errorFiles.push(file.name);
            Session.set("upload_error_files", errorFiles);
        } else {
            Meteor.call("createPhoto", downloadUrl, targetOperationId);
        }
    });
}

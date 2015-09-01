Meteor.subscribe("photos");

Template.operation.helpers({
    photos: function() {
        if (!this.photos) { return null; };
        var photos = Photos.find({
            _id: {
                $in: this.photos
            }
        });
        return photos;
    },

    isEditPermitted: function() {
        var userId = Meteor.userId();
        var isOwned = (this.owner === userId);
        var isAdmin = Roles.userIsInRole(userId, 'admin');
        return isOwned || isAdmin;
    },

    isUploading: function() {
        return (Session.get("uploading_file_num") !== Session.get("uploaded_file_num"));
        /*
        if (!Meteor.user().profile) {
            return false;
        };
        */
        //var uploading_file_num = Meteor.user().profile.uploading_file_num || 0;
        //var uploaded_file_num = Meteor.user().profile.uploaded_file_num || 0;
        return (uploading_file_num !== uploaded_file_num);
    },

    uploadingFileNum: function() {
        return Session.get("uploading_file_num");
    },

    uploadedFileNum: function() {
        return Session.get("uploaded_file_num");
    },

    uploadOperation: function() {
        return Session.get("upload_operation");
    },

});

Template.operation.events({
    'change .upload-photos': function(event) {
        var files = event.target.files;
        var targetOperationId = this._id;
        Session.set("uploading_file_num", files.length);
        Session.set("uploaded_file_num", 0);
        Session.set("upload_operation", this.name);
        Session.set("upload_error_files", []);
        _.each(files, function (file) {
            var uploader = new Slingshot.Upload("photos");

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
        });
        event.target.value = null;
    },

    'click .delete': function(event) {
        Meteor.call("deleteOperation", this._id);
    },

    'click .delete-all-photos': function(event) {
        Meteor.call("deleteAllPhotos", this._id);
    },
});

Template.photoThumbnail.helpers({
    originalUrl: function() {
        return this.original.url;
    },

    thumbnailUrl: function() {
        return this.thumbnail.url;
    }
});

Template.uploadErrorNotification.helpers({
    isErrorOccured: function() {
        var error_files = Session.get("upload_error_files");
        if (error_files) {
        return (error_files.length !== 0);
        } else {
            return false;
        }
    },

    errorFileNames: function() {
        return Session.get("upload_error_files");
    },

    errorOperation: function() {
        return Session.get("upload_operation");
    }

});

Template.uploadErrorNotification.events({
    'click .delete-error': function(event) {
        Session.set("upload_error_files", []);
    }
});

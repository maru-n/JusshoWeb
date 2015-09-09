Meteor.subscribe("photos");


Template.operation.helpers({
    photos: function() {
        if (!this.photos) { return null; };
        var photos = Photos.find({
            _id: {$in: this.photos},
            available: true
        },{
            sort: {name: 1}
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
    },

    uploadingFileNum: function() {
        return Session.get("uploading_file_num");
    },

    uploadedFileNum: function() {
        return Session.get("uploaded_file_num");
    },

    uploadOperation: function() {
        return Operations.findOne(Session.get("uploading_operation")).name;
    },

    uploadFailedNum: function() {
        return Session.get("upload_failed_file_num");
    },
});


var uploadFailedFiles = [];

function uploadFiles(files, operationId) {
    _.each(files, function (file) {
        Photos.insertFileBelongedOperation(file, operationId, function(error, photoId){
            Session.set("uploaded_file_num", Session.get("uploaded_file_num")+1);
            if (error) {
                console.error(error);
                Session.set("upload_failed_file_num", Session.get("upload_failed_file_num")+1);
                uploadFailedFiles.push(file);
            }else{

            }
        });
    });
}


Template.operation.events({
    'change .upload-files': function(event) {
        var files = event.target.files;
        Session.set("uploading_operation", this._id);
        Session.set("uploading_file_num", files.length);
        Session.set("uploaded_file_num", 0);
        Session.set("upload_failed_file_num", 0);
        uploadFailedFiles = [];
        uploadFiles(files, this._id);
        event.target.value = null;
    },

    'click .delete': function(event) {
        Meteor.call("deleteOperation", this._id);
    },

    'click .delete-all-photos': function(event) {
        Meteor.call("deleteAllPhotos", this._id);
    },

    'click .retry-upload-files': function(event) {
        var files = uploadFailedFiles;
        Session.set("upload_failed_file_num", 0);
        uploadFailedFiles = [];

        Session.set("uploading_file_num", files.length);
        Session.set("uploaded_file_num", 0);
        uploadFiles(files, Session.get("uploading_operation"));
    },

    'click .delete-failed-files': function(event) {
        Session.set("upload_failed_file_num", 0);
        upladFailedFiles = [];
    },
});

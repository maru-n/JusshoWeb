Meteor.subscribe("photos");
Meteor.subscribe("uploadTasks");

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
    editPermitted: function() {
        var userId = Meteor.userId();
        var isOwned = (this.owner === userId);
        var isAdmin = Roles.userIsInRole(userId, 'admin');
        return isOwned || isAdmin;
    },
    isFileUploading: function() {
        var num = Meteor.call("getUploadingFileNum");
        return Boolean(num);
    },
    userUploadStatus: function() {
        var uploadTask = UploadTasks.findOne({user: Meteor.userId()},{
            sort: {createdAt: -1}
        });
        if (!uploadTask) { return null; }

        var photos = Photos.find({
            _id: {
                $in: uploadTask.uploadingPhotos
            }
        });
        var totalNum = photos.count();
        var finishedNum = 0;
        photos.forEach(function(photo){
            if(photo.hasStored('thumbs')){
                finishedNum += 1;
            }
        });
        if (totalNum == finishedNum) { return null; }

        var operation = Operations.findOne(uploadTask.operation);
        if (!operation) { return null; }

        return {
            operation: operation.name,
            totalNum: totalNum,
            finishedNum: finishedNum
        }
    }
});

Template.operation.events({
    'change .upload-photos': function(event) {
        var files = event.target.files;
        //Meteor.call("insertOperationPhotos", this._id, files);
        var targetOperationId = this._id;
        var uploadTaskId = UploadTasks.insert({
            user: Meteor.userId(),
            createdAt: new Date(),
            operation: targetOperationId,
        });
        FS.Utility.eachFile(event, function(file) {
            var newFile = new FS.File(file);
            newFile.metadata = {
                owner: Meteor.userId()
            }
            var fileObj = Photos.insert(newFile, function (err, fileObj) {
                if (err) {
                }else{
                    Operations.update(targetOperationId, {
                        $addToSet: {photos: fileObj._id}
                    });
                }
            });
            UploadTasks.update(uploadTaskId, {
                $addToSet: {uploadingPhotos: fileObj._id}
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

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
    isOwned: function() {
        return this.owner === Meteor.userId();
    },
});

Template.operation.events({
    'change .upload-photos': function(event) {
        var targetOperationId = this._id;
        FS.Utility.eachFile(event, function(file) {
            //Meteor.call("createPhoto", file, Session.get("currentOperationId"));
            var newFile = new FS.File(file);
            newFile.metadata = {
                owner: Meteor.userId()
            }
            var fileObj = Photos.insert(newFile, function(){

            });
            Operations.update(targetOperationId, {
                $addToSet: {photos: fileObj._id}
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

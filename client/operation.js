Meteor.subscribe("photos");
Meteor.subscribe('photos');

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
    }
});

Template.operation.events({
    'change .upload-photos': function(event) {
        var files = event.target.files;
        var targetOperationId = this._id;
        _.each(files, function (file) {
            var uploader = new Slingshot.Upload("photos");
            uploader.send(file, function (error, downloadUrl) {
                if (error) {
                    console.error(uploader.xhr.response)
                    console.error(error);
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
})

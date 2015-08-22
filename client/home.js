Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
});


Template.home.helpers({
    isOperationSelected: function() {
        return Session.get("currentOperationId");
    },
    isUserUploading: function(){
        var photos = Photos.find({
            owner: Meteor.userId()
        });
        return photos;
    },
});

Template.operationList.helpers({
    operations: function() {
        return Operations.find({},{
            sort: {
              createdAt: -1
          }
      });
    },
    operationDefaultName: function() {
        return Operations.defaultName();
    },
});

Template.operationList.events({
    'submit .new-operation': function(event) {
        event.preventDefault();
        var text = event.target.text.value;
        Meteor.call("createOperation", text);
        event.target.text.value = "";
    },
    'click .operation-link': function(event) {
        event.preventDefault();
        Session.set("currentOperationId", this._id);
    },
});

Template.operation.helpers({
    isOwned: function() {
        return this.owner === Meteor.userId();
    },
    ownerName: function() {
        var owner = Meteor.users.findOne(this.owner);
        if (owner) {
            return owner.username;
        };
    }
});

Template.operation.events({
    'click .delete': function(event) {
        Meteor.call("deleteOperation", this._id);
    }
});

Template.photoList.helpers({
    currentOperationName: function() {
        var currentOperation = Operations.findOne(Session.get("currentOperationId"));
        return currentOperation.name;
    },
    currentOperationId: function() {
        return Session.get("currentOperationId");
    },
    photos: function() {
        var currentOperation = Operations.findOne(Session.get("currentOperationId"));
        if (!currentOperation.photos) {
            return null;
        };
        var photos = Photos.find({
            _id: {
                $in: currentOperation.photos
            }
        });
        return photos;
    },
});

Template.photoList.events({
    'change .upload-photos': function(event) {
        FS.Utility.eachFile(event, function(file) {
            //Meteor.call("createPhoto", file, Session.get("currentOperationId"));
            var operationId = Session.get("currentOperationId");
            var newFile = new FS.File(file);
            newFile.metadata = {
                owner: Meteor.userId()
            }
            var fileObj = Photos.insert(newFile, function(){

            });
            Operations.update(operationId, {
                $addToSet: {photos: fileObj._id}
            });
        });
        event.target.value = null;
    },
    'click .delete-all-photos': function(event) {
        Meteor.call("deleteAllPhotos", Session.get("currentOperationId"));
    }
});

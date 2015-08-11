Template.home.helpers({
    isOperationSelected: function() {
      return Session.get("currentOperationId");
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
        if (!text) {
            text = Operations.defaultName();
        };
        Operations.insert({
            name: text,
            owner: Meteor.userId(),
            createdAt: new Date(),
        })
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
    photos: function() {
        var currentOperation = Operations.findOne(Session.get("currentOperationId"));
        if (!currentOperation.photos) {
            return;
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
    'change .upload-photos': function(event, template) {
        FS.Utility.eachFile(event, function(file) {
            var newFile = new FS.File(file);
            newFile.metadata = {
                owner: Meteor.userId()
            }
            var fileObj = Photos.insert(newFile);
            Operations.update(
                Session.get("currentOperationId"),
                {
                    $addToSet: {photos: fileObj._id}
                });
        });
        event.target.value = null;
    }
});

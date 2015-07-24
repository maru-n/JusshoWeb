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
    return _.contains(fields, "photos") || (userId && doc.owner === userId);
  },
  remove: function (userId, doc) {
    return (userId && doc.owner === userId);
  },
});

//FS.debug = true;

var createSquareThumb = function(fileObj, readStream, writeStream) {
    var size = '96';
    gm(readStream).autoOrient().resize(size, size + '^').gravity('Center').extent(size, size).stream('PNG').pipe(writeStream);
};

Photos = new FS.Collection('photos', {
    stores: [
    new FS.Store.GridFS('originals', {}),
    new FS.Store.GridFS("thumbs", { transformWrite: createSquareThumb })
    ],
    filter: {
      allow: {contentTypes: ['image/*']}
    }
});

Accounts.config({
  forbidClientAccountCreation: true,
});

if (Meteor.isClient) {

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

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
      Operations.remove(this._id);
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
        var fileObj = Photos.insert(file);
        Operations.update(
          Session.get("currentOperationId"),
          {
            $addToSet: {photos: fileObj._id}
          });
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
  });
}

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

const USE_S3 = false;
//FS.debug = true;

var createSquareThumb = function(fileObj, readStream, writeStream) {
    var size = 96;
    gm(readStream).autoOrient().resize(size, size + '^').gravity('Center').extent(size, size).stream('PNG').pipe(writeStream);
};

if (USE_S3) {
    var original_image_store = new FS.Store.S3("originals", {
        region: "ap-northeast-1",
        bucket: "maruyama.meteor-test",
        folder: "originals",
    });
    var thumbs_image_store = new FS.Store.S3("thumbs", {
        region: "ap-northeast-1",
        bucket: "maruyama.meteor-test",
        folder: "thumbs",
        transformWrite: createSquareThumb,
    });
} else {
    var original_image_store = new FS.Store.FileSystem('originals', {
    });
    var thumbs_image_store = new FS.Store.FileSystem("thumbs", {
        transformWrite: createSquareThumb
    })
}

Photos = new FS.Collection('photos', {
    stores: [original_image_store, thumbs_image_store],
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
}
Meteor.methods({
    deleteOperation: function (operationId) {
        Photos.remove({
            _id: {
                $in: Operations.findOne(operationId).photos
            }
        });
        Operations.remove(operationId);
    },
});

if (Meteor.isServer) {
    Meteor.startup(function () {
    });
}

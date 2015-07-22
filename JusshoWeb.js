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
    return (userId && doc.owner === userId);
  },
  remove: function (userId, doc) {
    return (userId && doc.owner === userId);
  },
});

Accounts.config({
  forbidClientAccountCreation: true,
});

if (Meteor.isClient) {

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
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
  });

  Template.operation.helpers({
    isOwned: function() {
      return this.owner === Meteor.userId();
    }
  })

  Template.operation.events({
    'click .delete': function(event) {
      Operations.remove(this._id);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
  });
}

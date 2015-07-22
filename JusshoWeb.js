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

Accounts.config({
  forbidClientAccountCreation: true,
});

if (Meteor.isClient) {

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });


  Template.operations.helpers({
    operations: function() {
      return Operations.find();
    },
    operationDefaultName: function() {
      return Operations.defaultName();
    },
  });

  Template.operations.events({
    'submit .new-operation': function(event) {
      event.preventDefault();
      var text = event.target.text.value;
      if (!text) {
        text = Operations.defaultName();
      };
      Operations.insert({
        name: text,
        //owner: Meteor.userId(),
      })
      event.target.text.value = "";
    },
  });

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

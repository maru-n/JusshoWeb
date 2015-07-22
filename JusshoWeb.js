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

if (Meteor.isClient) {

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
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
  });
}

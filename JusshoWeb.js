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
    operations: function () {
      return Operations.find();
    },
  });

  Template.operations.events({
    'click .new-operation': function(event) {
      Operations.insert({
        name: Operations.defaultName(),
        //owner: Meteor.userId(),
      })
    },
  });

  Template.operation.events({
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
  });
}

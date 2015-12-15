Meteor.subscribe("users");

Template.operationList.onCreated(function(){
    Meteor.subscribe("coverPhotos");
});


Template.operationList.helpers({
});


Template.operationView.onCreated(function(){
    Meteor.subscribe("operationPhotoCount", this.data);
});


Template.operationView.helpers({
    ownerName: function() {
        var owner = Meteor.users.findOne(this.owner);
        if (owner) {
            return owner.username;
        };
    },

    coverPhotoUrl: function() {
        var coverPhoto = Photos.findOne({operation:this._id});
        try {
            return coverPhoto.medium.url
        } catch (e) {
            return "http://placehold.jp/40/3f51b5/ffffff/400x300.png?text=%E5%86%99%E7%9C%9F%E3%81%8C%E3%81%AA%E3%81%84%EF%BC%81%EF%BC%81"
        }
    },

    photoCount: function() {
        return  Counts.get("operationPhotoCount"+this._id);
    }
})

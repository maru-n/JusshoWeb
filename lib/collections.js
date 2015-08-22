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
    var size = 96;
    gm(readStream).autoOrient().resize(size, size + '^').gravity('Center').extent(size, size).stream('PNG').pipe(writeStream);
};

if (Meteor.settings.awsS3) {
    var original_image_store = new FS.Store.S3("originals", {
        region: Meteor.settings.awsS3Region,
        bucket: Meteor.settings.awsS3Bucket,
        accessKeyId: Meteor.settings.awsAccessKeyId,
        secretAccessKey: Meteor.settings.awsSecretKey,
        folder: "originals",
    });
    var thumbs_image_store = new FS.Store.S3("thumbs", {
        region: Meteor.settings.awsS3Region,
        bucket: Meteor.settings.awsS3Bucket,
        accessKeyId: Meteor.settings.awsAccessKeyId,
        secretAccessKey: Meteor.settings.awsSecretKey,
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
/*
Photos.allow({
    insert: function (userId, doc) {
        return (userId);
    }
});
*/

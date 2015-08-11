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

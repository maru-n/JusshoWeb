Router.route('/', {template: 'Home'})

Router.route('/operation/:_id/photos.zip', function () {
    this.response.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=filename.zip"
    });
    var zip = archiver('zip');
    zip.pipe(this.response);


    var operation = Operations.findOne(this.params._id);
    if (!operation.photos) {
        return null;
    };
    var photos = Photos.find({
        _id: {
            $in: operation.photos
        }
    });
    photos.forEach(function(file) {
        var readStream = file.createReadStream('files');
        zip.append(readStream, {
            name: file.name()
        });
    });
    zip.finalize();
},{
    where: 'server'
});

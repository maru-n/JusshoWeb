Router.route('/', function () {
    this.render('home');
});

Router.route('/zip', function () {
    this.response.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=filename.zip"
    });
    var zip = archiver('zip');
    zip.pipe(this.response);
    Photos.find().forEach(function(file) {
        var readStream = file.createReadStream('files');
        zip.append(readStream, {
            name: file.name()
        });
    });
    zip.finalize();
},{
    where: 'server'
});

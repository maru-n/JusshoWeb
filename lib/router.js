Router.configure({
    layoutTemplate: 'layout'
});

Router.onBeforeAction(function () {
    if (Meteor.settings.public.underConstruction) {
        this.render('UnderConstraction');
    } else if (!Meteor.userId()) {
        this.layout('NotLoggedInLayout');
        this.render('Login');
    } else {
        this.next();
    }
});

Router.route('/', function(){
    this.render('Home');
});

Router.route('/login', function(){
    if (Meteor.userId()) {
        this.redirect('/');
    } else {
        this.layout('NotLoggedInLayout');
        this.render('Login');
    }
});

Router.route('/operation/:_id', function(){
    var operation = Operations.findOne(this.params._id);
    if (operation) {
        this.render('Operation', {
            data: function () {
                return Operations.findOne(this.params._id);
            }
        });
        this.render('OperationAside', {to: 'aside'});
    } else {
        this.redirect('/');
    }
});

Router.route('/operation/:_id/photos.zip', function () {
    var operation = Operations.findOne(this.params._id);
    if (!operation.photos) {
        return null;
    };
    var photos = Photos.find({
        _id: {
            $in: operation.photos
        }
    });

    this.response.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename="+operation._id+".zip"
    });

    var zip = archiver('zip');
    zip.pipe(this.response);

    var i = 0;
    var num_len = ((photos.count())+"").length;
    photos.forEach(function(file) {
        var readStream = file.createReadStream('files');

        var n = '' + i++;
        var name = num_len+1 - n.length > 0 ? Array(num_len + 1 - n.length).join('0') + n : n;
        name += "_"
        name += file.name()
        zip.append(readStream, {
            name: name,
        });
    });
    zip.finalize();
},{
    where: 'server'
});

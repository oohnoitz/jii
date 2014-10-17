var mongoose = require('mongoose');
var Grid = require('gridfs-locking-stream');

module.exports = function (config) {
    var fs = {};

    fs._client = mongoose.createConnection('mongodb://' + config.db.host + ':' + config.db.port + '/' + config.db.data, { server: { auto_reconnect: true }});
    fs._gridfs = Grid(fs._client.db, mongoose.mongo);
    fs._client.on('open', function (err, d) {
        if (err) {
            console.log(err);
        } else {
            console.log('connected to database :: ' + config.db.data);
        }
    });

    fs.delete = function (metadata, cb) {
        var self = this;
        self._gridfs.remove(metadata, function (err, res) {
            if (err || res == null) {
                return cb(null);
            }

            return cb(res);
        });
    };

    fs.find = function (guid, cb) {
        var self = this;
        self._gridfs.files.findOne({ _id: guid }, function (err, res) {
            if (err || res === null) {
                return cb(null);
            }

            return cb(res);
        });
    };

    fs.read = function (guid, cb) {
        var self = this;
        self._gridfs.createReadStream({ _id: guid }, function (err, readStream) {
            if (readStream) {
                return cb(null, readStream);
            } else {
                return cb(true);
            }
        });
    };

    fs.save = function (metadata, readStream, cb) {
        var self = this;
        self._gridfs.createWriteStream(metadata, function (err, writeStream) { 
            writeStream.on('error', function (err) {
                return cb(err);
            });

            writeStream.on('close', function (data) {
                return cb(null, data);
            });

            readStream.pipe(writeStream);
        });
    };

    return fs;
};


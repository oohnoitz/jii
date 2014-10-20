var bcrypt = require('bcrypt');
var crypto = require('crypto');
var cryptostream = require('cryptostream');
var passStream = require('pass-stream');
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

    fs.delete = function (file, cb) {
        var self = this;
        self._gridfs.remove(file, function (err, res) {
            if (err || res == null) {
                return cb(true);
            }

            return cb(null, res);
        });
    };

    fs.find = function (guid, cb) {
        var self = this;
        self._gridfs.files.findOne({ _id: guid }, function (err, res) {
            if (err || res === null) {
                return cb(true);
            }

            return cb(null, res);
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

    fs.save = function (file, readStream, cb) {
        var self = this;

        if (file.metadata.secure && (!file.crypto.algorithm || !file.crypto.key)) {
            return cb('You did not provide a valid crypto algorithm and/or key.');
        }

        var encryptStream = passStream();
        if (file.metadata.secure && file.crypto.algorithm && file.crypto.key) {
            if (crypto.getCiphers().indexOf(file.crypto.algorithm) === -1) {
                return cb('You must use one of the following crypto algorithms: ' + crypto.getCiphers().toString().toUpperCase() + '.');
            }

            encryptStream = new cryptostream.EncryptStream({ algorithm: file.crypto.algorithm, key: file.crypto.key });
        }

        bcrypt.hash(file.deleteHash, 8, function (err, hash) {
            file.metadata.deleteHash = hash;
            self._gridfs.createWriteStream(file, function (err, writeStream) {
                writeStream.on('error', function (err) {
                    return cb(err);
                });

                writeStream.on('close', function (data) {
                    return cb(null, data);
                });

                readStream.pipe(encryptStream).pipe(writeStream);
            });
        });
    };

    return fs;
};

var bcrypt = require('bcrypt');
var crypto = require('crypto');
var cryptostream = require('cryptostream');
var detectMime = require('stream-mmmagic');
var passStream = require('pass-stream');
var mongoose = require('mongoose');
var Grid = require('gridfs-locking-stream');
var Gifsicle = require('gifsicle-stream');
var JpegTran = require('jpegtran');
var OptiPng = require('optipng');

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
            if (err || res === null) {
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

        detectMime(readStream, function (err, mime, dataStream) {
            if (err) {
                return cb(err);
            }

            // image post-processing optimizations
            var imageProcessingStream = passStream();
            switch (mime.type) {
                case 'image/gif':
                    imageProcessingStream = new Gifsicle(['-w', '-O3']);
                    break;
                case 'image/jpeg':
                    imageProcessingStream = new JpegTran(['-copy', 'all', '-optimize', '-progressive']);
                    break;
                case 'image/png':
                    imageProcessingStream = new OptiPng();
                    break;
            }

            // file encryption
            var encryptStream = passStream();
            if (file.metadata.secure && file.crypto.algorithm && file.crypto.key) {
                if (crypto.getCiphers().indexOf(file.crypto.algorithm) === -1) {
                    return cb('You must use one of the following crypto algorithms: ' + crypto.getCiphers().toString().toUpperCase() + '.');
                }

                encryptStream = new cryptostream.EncryptStream({ algorithm: file.crypto.algorithm, key: file.crypto.key });
            }

            // store file
            bcrypt.hash(file.deleteHash, 8, function (err, hash) {
                file.content_type = mime.type;
                file.metadata.deleteHash = hash;
                self._gridfs.createWriteStream(file, function (err, writeStream) {
                    writeStream.on('error', function (err) {
                        return cb(err);
                    });

                    writeStream.on('close', function (data) {
                        return cb(null, data);
                    });

                    dataStream.pipe(imageProcessingStream).pipe(encryptStream).pipe(writeStream);
                });
            });

        });
    };

    return fs;
};

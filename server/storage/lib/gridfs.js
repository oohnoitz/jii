var internals = {};

module.exports = internals.fs = function (opts) {
    this._client = opts.db.client;
    this._gridfs = opts.db.gridfs;
};

internals.fs.prototype.delete = function (metadata, cb) {
    var self = this;
    self._gridfs.remove(metadata, function (err, res) {
        if (err || res == null) {
            return cb(null);
        }

        return cb(res);
    });
};

internals.fs.prototype.find = function (guid, cb) {
    var self = this;
    self._gridfs.files.findOne({ _id: guid }, function (err, res) {
        if (err || res === null) {
            return cb(null);
        }

        return cb(res);
    });
};

internals.fs.prototype.read = function (guid, cb) {
    var self = this;
    self._gridfs.createReadStream({ _id: guid }, function (err, readStream) {
        if (readStream) {
            return cb(null, readStream);
        } else {
            return cb(true);
        }
    });
};

internals.fs.prototype.save = function (metadata, readStream, cb) {
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

var bcrypt = require('bcrypt');
var clamav = require('clamav.js');
var guid = require('shortid');
var http = require('http');
var mime = require('mime-types');
var path = require('path');
var rand = require('random-key');
var Promise = require('es6-promise').Promise;
var headers = require('../../../utils/headers');

module.exports = {
    select: function (request, reply) {
        var self = this;
        var guid = request.params.guid ? request.params.guid.split('.')[0] : null;

        self.fs.find(guid, function (err, file) {
            if (err || file === null) {
                return reply({ 'statusCode': 404, 'error': 'Not Found' })
                    .code(404);
            }

            delete file.metadata;
            delete file.aliases;

            return reply(file);
        });
    },
    create: function (request, reply) {
        var self = this;

        if (!request.payload['file'] && !request.payload['link']) {
            return reply({ 'statusCode': 400, 'error': 'Bad Request' });
        }

        if (request.payload['file']) {
            var data = parseReq('file', request, null);
            return saveFile(self, data, request.payload['file'], reply);
        }

        if (request.payload['link']) {
            http.get(request.payload['link'], function (file) {
                var data = parseReq('link', request, file);
                return saveFile(self, data, file, reply);
            }).on('error', function (err) {
                return reply({ error: 'Connection Failed', message: 'Unable to retrieve remote file.' });
            });
        }
    },
    remove: function (request, reply) {
        var self = this;
        var guid = request.params.guid ? request.params.guid.split('.')[0] : null;
        var hash = request.params.hash || null;

        self.fs.find(guid, function (err, file) {
            if (err || file === null) {
                return reply({ 'statusCode': 404, 'error': 'Not Found' })
                    .code(404);
            }

            bcrypt.compare(hash, file.metadata.deleteHash, function (err, res) {
                if (res) {
                    self.fs.delete(file, function (err, res) {
                        return reply({ 'statusCode': 200, 'message': 'The file has been deleted.' });
                    });
                } else {
                    return reply({ 'statusCode': 401, 'error': 'Invalid Deletion Hash.' })
                        .code(401);
                }
            });
        });
    }
};

var parseReq = function (type, req, res) {
    var file = {
        _id: guid.generate(),
        filename: rand.generate(),
        mode: 'w',
        content_type: 'application/octet-stream',
        deleteHash: req.payload['delete-hash'] || rand.generate(),
        crypto: {
            algorithm: req.payload['crypto-algorithm'] || null,
            key: req.payload['crypto-key'] || null
        },
        metadata: {
            secure: Boolean(parseInt(req.payload['secure']))
        }
    }

    switch (type) {
        case 'file':
            file.filename = req.payload['filename'] || req.payload['file'].hapi.filename;
            file.content_type = mime.lookup(req.payload['file'].hapi.filename) || 'application/octet-stream';
            break;
        case 'link':
            file.filename = req.payload['filename'] || headers.parseContentDisposition(res.headers['content-disposition']).filename || path.basename(req.payload['link']);
            file.content_type = res.headers['content-type'].split(';')[0] || mime.lookup(req.payload['link']) || 'application/octet-stream';
            break;
        default:
            return {};
    }

    return file;
}

var saveFile = function (self, data, fileStream, reply) {
    var save = new Promise(function (resolve, reject) {
        self.fs.save(data, fileStream, function (err, file) {
            if (err) {
                reject({ data: data, error: 'Storage Error', message: err });
            } else {
                delete file.aliases;
                file.metadata.deleteHash = data.deleteHash;
                file.url = self.config.app.uri + (file.metadata.secure ? '/s/' : '/') + file._id + path.extname(file.filename);

                if (self.config.clamav.enabled === true) {
                    self.fs.read(file._id, function (e, dataStream) {
                        clamav.createScanner(self.config.clamav.port, self.config.clamav.host).scan(dataStream, function (err, obj, mal) {
                            if (mal) {
                                reject({ data : data, error: 'Virus Signature Detected', message: 'This file contains a virus signature. (' + mal + ')' });
                            } else {
                                resolve(file);
                            }
                        });
                    });
                } else {
                    resolve(file);
                }
            }
        });
    });

    save.then(function (result) {
        return reply(result);
    }, function (error) {
        self.fs.delete(error.data, function (err, res) {
            return reply({ error: error.error, message: error.message });
        });
    });
};

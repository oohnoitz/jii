var clamav = require('clamav.js');
var guid = require('shortid');
var http = require('http');
var mime = require('mime-types');
var path = require('path');
var Promise = require('es6-promise').Promise;
var headers = require('../../../utils/headers');

module.exports = {
    select: function (request, reply) {
        var self = this;
        var guid = request.params.guid ? request.params.guid.split('.')[0] : null;

        self.fs.find(guid, function (metadata) {
            if (metadata === null) {
                return reply({ 'statusCode': 404, 'error': 'Not Found' })
                    .code(404);
            }

            delete metadata.metadata;
            delete metadata.aliases;

            return reply(metadata);
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
    }
};

var parseReq = function (type, req, res) {
    switch (type) {
        case 'file':
            return {
                _id: guid.generate(),
                filename: req.payload['filename'] || req.payload['file'].hapi.filename,
                content_type: mime.lookup(req.payload['file'].hapi.filename) || 'application/octet-stream'
            };
        case 'link':
            return {
                _id: guid.generate(),
                filename: req.payload['filename'] || headers.parseContentDisposition(res.headers['content-disposition']).filename || path.basename(req.payload['link']),
                mode: 'w',
                content_type: res.headers['content-type'].split(';')[0] || mime.lookup(req.payload['link']) || 'application/octet-stream'
            };
        default:
            return {};
    }
}

var saveFile = function (self, data, fileStream, reply) {
    var save = new Promise(function (resolve, reject) {
        self.fs.save(data, fileStream, function (err, file) {
            if (err) {
                reject({ data: data, error: 'Storage Error', message: err });
            } else {
                delete file.metadata;
                delete file.aliases;
                file.url = self.config.app.uri + '/' + file._id + path.extname(file.filename);

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

var clamav = require('clamav.js');
var guid = require('shortid');
var mime = require('mime-types');
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
        var data = {
            _id: guid.generate(),
            filename: request.payload['file'].hapi.filename,
            mode: 'w',
            content_type: mime.lookup(request.payload['file'].hapi.filename) || 'application/octet-stream'
        };

        saveFile(self, data, request.payload['file']).then(function (result) {
            return reply(result);
        }, function (err) {
            self.fs.delete(err.data, function (e, r) {
                return reply({ error: err.error, message: err.message });
            });
        });
    }
};

var saveFile = function (self, data, fileStream) {
    return new Promise(function (resolve, reject) {
        self.fs.save(data, fileStream, function (err, file) {
            if (err) {
                reject({ data: data, error: 'Storage Error', message: err });
            } else {
                delete file.metadata;
                delete file.aliases;
                file.url = self.config.app.uri + '/' + file._id + '.' + mime.extension(file.contentType);

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
};

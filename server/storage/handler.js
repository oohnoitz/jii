var clamav = require('clamav.js');
var guid = require('shortid');
var mime = require('mime-types');
var Promise = require('es6-promise').Promise;
var headers = require('../utils/headers');

module.exports = {
    select: function (request, reply) {
        var self = this;
        var guid = request.params.guid.split('.')[0];

        self.fs.find(guid, function (metadata) {
            if (metadata === null) {
                return reply({ 'statusCode': 404, 'error': 'Not Found' })
                    .code(404);
            }

            self.fs.read(guid, function (err, data) {
                if (err) {
                    return reply({ 'statusCode': 500, 'error': 'Internal Server Error', 'message': 'We encountered an unexpected readStream error.' })
                        .code(500);
                } else {
                    return reply(data)
                        .header('Content-Disposition', headers.generateContentDisposition(metadata))
                        .header('Content-Type', (metadata.contentType || 'application/octet-stream'))
                        .header('ETag', metadata.md5)
                        .header('Last-Modified', metadata.uploadDate.toUTCString());
                }
            });
        });
    },
    insert: function (request, reply) {
        var self = this;

        var fileStream = request.payload['file'];
        var data = {
            _id: guid.generate(),
            filename: fileStream.hapi.filename,
            mode: 'w',
            content_type: mime.lookup(fileStream.hapi.filename) || 'application/octet-stream'
        };

        saveFile(self, data, fileStream).then(function (result) {
            reply(result);
        }, function (err) {
            self.fs.delete(err.data, function (e, r) {
                reply({ error: err.error, message: err.message });
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

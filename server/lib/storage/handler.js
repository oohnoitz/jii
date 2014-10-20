var cryptostream = require('cryptostream');
var passStream = require('pass-stream');
var clamav = require('clamav.js');
var guid = require('shortid');
var mime = require('mime-types');
var Promise = require('es6-promise').Promise;
var headers = require('../../utils/headers');

module.exports = {
    select: function (request, reply) {
        var self = this;
        var guid = request.params.guid.split('.')[0];

        self.fs.find(guid, function (err, file) {
            if (err || file === null) {
                return reply({ 'statusCode': 404, 'error': 'Not Found' })
                    .code(404);
            }

            self.fs.read(guid, function (err, data) {
                if (err) {
                    return reply({ 'statusCode': 500, 'error': 'Internal Server Error', 'message': 'We encountered an unexpected readStream error.' })
                        .code(500);
                }

                var decryptStream = passStream();
                if (file.metadata.secure) {
                    decryptStream = new cryptostream.DecryptStream({ algorithm: request.params.algorithm || null, key: request.params.key || null });
                }

                return reply(data.pipe(decryptStream))
                    .header('Content-Disposition', headers.generateContentDisposition(file))
                    .header('Content-Type', (file.contentType || 'application/octet-stream'))
                    .header('ETag', file.md5)
                    .header('Last-Modified', file.uploadDate.toUTCString());
            });
        });
    }
};

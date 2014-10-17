var clamav = require('clamav.js');
var guid = require('shortid');
var mime = require('mime-types');
var Promise = require('es6-promise').Promise;
var headers = require('../../utils/headers');

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
    }
};

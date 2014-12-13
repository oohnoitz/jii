/**
* Dependencies.
*/
var path = require('path'),
rootPath = path.normalize(__dirname + '/../..');

module.exports = {
    root: rootPath,
    hapi: {
        options: {
            views: {
                path: './server/views',
                engines: {
                    html: require('swig')
                }
            }
        }
    }
};

var gridfs = require('./lib/gridfs');

exports.register = function(plugin, options, next) {
    var config = options.app;
    var fs = new gridfs(options);

    plugin.bind({
        config: config,
        fs: fs
    });

    plugin.route({
        method: 'GET',
        path: '/{guid*}',
        handler: require('./handler').select
    });

    plugin.route({
        method: 'POST',
        path: '/upload',
        config: {
            handler: require('./handler').insert,
            payload: {
                maxBytes: config.storage.maxUploadSize,
                output: 'stream',
                parse: true
            },
            app: {
                name: 'insert'
            }
        }
    });

    return next();
};

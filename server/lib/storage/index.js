exports.register = function(plugin, options, next) {
    var fs = require('./lib/gridfs')(options.config);

    plugin.expose('fs', fs);
    plugin.bind({
        config: options.config,
        fs: fs
    });

    plugin.route({
        method: 'GET',
        path: '/{guid*}',
        handler: require('./handler').select
    });

    next();
};

exports.register = function(plugin, options, next) {
    var fs = require('./lib/gridfs')(options.config);

    plugin.expose('fs', fs);
    plugin.bind({
        config: options.config,
        fs: fs
    });

    plugin.route({
        method: 'GET',
        path: '/s/{guid}/{algorithm}/{key}',
        handler: require('./handler').select
    });

    plugin.route({
        method: 'GET',
        path: '/{guid*}',
        handler: require('./handler').select
    });

    next();
};

exports.register.attributes = {
    name: 'storage',
    version: '0.1.0'
};

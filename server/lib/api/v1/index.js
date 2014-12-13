exports.register = function (plugin, options, next) {
    plugin.bind({
        config: options.config,
        fs: plugin.plugins.storage.fs
    });

    var routes = require('./routes')(options.config);
    plugin.route(routes);

    return next();
};

exports.register.attributes = {
    name: 'api',
    version: '1.0.0'
};

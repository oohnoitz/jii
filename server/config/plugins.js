module.exports = function (server, config) {
    var options = {
        assets: require('../../assets'),
        good: {
            reporters: [{
                reporter: require('good-console'),
                args: [{ ops: '*', log: '*', response: '*', error: '*' }]
            }]
        }
    };

    // Register Plugins
    server.register([
        {
            register: require('good'),
            options: options.good
        },
        {
            register: require('hapi-assets'),
            options: options.assets
        },
        {
            register: require('../lib/storage'),
            options: {
                config: config
            }
        },
        {
            register: require('../lib/api/v1'),
            options: {
                config: config
            }
        }
    ], function (err) {
        if (err) throw err;
    });
};

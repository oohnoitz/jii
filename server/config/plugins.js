module.exports = function (server, config) {
    var mongoose = require('mongoose');
    var Grid = require('gridfs-locking-stream');

    // MongoDB / GridFS
    var client = mongoose.createConnection('mongodb://' + config.db.host + ':' + config.db.port + '/' + config.db.data, { server: { auto_reconnect: true }});
    var gridfs = Grid(client.db, mongoose.mongo);
    client.on('open', function (err, d) {
        if (err) {
            console.log(err);
        } else {
            console.log('connected to database :: ' + config.db.data);
        }
    });

    // Options to pass into the 'Good' plugin
    var goodOptions = {
        subscribers: {
            console: ['ops', 'request', 'log', 'error']
        }
    };
    // The Assets Configuaration Options
    var assetOptions = require('../../assets');

    server.pack.register([
        {
            plugin: require('good'),
            options: goodOptions
        },
        {
            plugin: require('hapi-assets'),
            options: assetOptions
        },
        {
            plugin: require('hapi-named-routes')
        },
        {
            plugin: require('hapi-cache-buster')
        },
        {
            name: 'gridfs-storage',
            plugin: require('../storage'),
            options: {
                app: config,
                db: {
                    client: client,
                    gridfs: gridfs
                }
            }
        }
    ], function (err) {
        if (err) throw err;
    });
};

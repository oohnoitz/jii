/**
* Dependencies.
*/
var Hapi = require('hapi'),
    settings = require('./server/config/settings'),
    config = require('./config');

// Create a server with a host, port, and options
var server = new Hapi.Server();
server.connection({ host: config.app.host, port: config.app.port });

// Export the server to be required elsewhere.
module.exports = server;

// Bootstrap Server Plugins, passes the server object to the plugins
require('./server/config/plugins')(server, config);

// Require the routes and pass the server object.
var routes = require('./server/config/routes')(config);
server.route(routes);

// Setup Views
server.views(settings.hapi.options.views);

//Start Server
server.start(function() {
    //Log to the console the host and port info
    console.log('Server started at: ' + server.info.uri);
});

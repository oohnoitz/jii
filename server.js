/**
* Dependencies.
*/
var Hapi = require('hapi'),
    settings = require('./server/config/settings'),
    config = require('./config');

// Create a server with a host, port, and options
var server = Hapi.createServer(config.app.host, config.app.port, settings.hapi.options);

// Export the server to be required elsewhere.
module.exports = server;

// Bootstrap Hapi Server Plugins, passes the server object to the plugins
require('./server/config/plugins')(server, config);

// Require the routes and pass the server object.
var routes = require('./server/config/routes')(server, config);
// Add the server routes
server.route(routes);

//Start the server
server.start(function() {
    //Log to the console the host and port info
    console.log('Server started at: ' + server.info.uri);
});

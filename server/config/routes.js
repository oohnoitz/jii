/**
* Dependencies.
*/
var requireDirectory = require('require-directory');

module.exports = function (server, config) {
    // Bootstrap your controllers so you dont have to load them individually. This loads them all into the controller name space. https://github.com/troygoode/node-require-directory
    var controller = requireDirectory(module, '../controllers');

    // Array of routes for Hapi
    var routeTable = [
        {
            method: 'GET',
            path: '/',
            config: controller.base.index
        },
        {
            method: 'GET',
            path: '/assets/images/{path*}',
            config: controller.assets.images
        },
        {
            method: 'GET',
            path: '/assets/css/{path*}',
            config: controller.assets.css
        },
        {
            method: 'GET',
            path: '/assets/js/{path*}',
            config: controller.assets.js
        },
        {
            method: 'GET',
            path: '/assets/bower/{path*}',
            config: controller.assets.bower
        }
    ];
    return routeTable;
}

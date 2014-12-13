/**
* Dependencies.
*/
var requireDirectory = require('require-directory');

module.exports = function (config) {
    var controller = requireDirectory(module, '../controllers');

    // Array of routes for Hapi
    return [
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
};

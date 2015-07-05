/**
* Dependencies.
*/
var requireDirectory = require('require-directory');

module.exports = function (config) {
    var controller = requireDirectory(module, '../controllers');

    return [
        {
            method: 'GET',
            path: '/assets/{path*}',
            config: {
                handler: {
                    directory: { path: './public/assets' }
                }
            }
        },
        {
            method: 'GET',
            path: '/about',
            config: controller.base.about
        },
        {
            method: 'GET',
            path: '/',
            config: controller.base.index
        }
    ];
};

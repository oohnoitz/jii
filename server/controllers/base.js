module.exports = {
    index: {
        handler: function (request, reply) {
            reply.view('index', {
                title: 'じーっ',
                app: require('../../config.js'),
                jii: require('../../package.json')
            });
        },
        app: {
            name: 'index'
        }
    }
}

module.exports = {
    index: {
        handler: function (request, reply) {
            reply.view('index', {
                title: 'じーっ',
                jii: require('../../package.json')
            });
        },
        app: {
            name: 'index'
        }
    }
}

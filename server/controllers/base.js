var data = {
    title: 'じーっ',
    app: require('../../config.js'),
    jii: require('../../package.json')
};

module.exports = {
    index: {
        handler: function (request, reply) {
            reply.view('index', data);
        }
    },
    about: {
        handler: function (request, reply) {
            reply.view('about', data);
        }
    }
};

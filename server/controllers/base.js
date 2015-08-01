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
            reply.view('content/about', data);
        }
    },
    terms: {
        handler: function (request, reply) {
            reply.view('content/terms', data);
        }
    },
    privacy: {
        handler: function (request, reply) {
            reply.view('content/privacy', data);
        }
    }
};

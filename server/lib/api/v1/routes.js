module.exports = function (config) {
    var routes = [
        {
            method: 'DELETE',
            path: '/api/v1/upload/{guid}/{hash}',
            handler: require('./handler').remove
        },
        {
            method: 'POST',
            path: '/api/v1/upload',
            config: {
                handler: require('./handler').create,
                payload: {
                    maxBytes: config.storage.maxUploadSize,
                    output: 'stream',
                    parse: true
                },
                app: {
                    name: 'create'
                }
            }
        },
        {
            method: 'GET',
            path: '/api/v1/upload/{guid*}',
            handler: require('./handler').select
        }
    ];

    return routes;
}

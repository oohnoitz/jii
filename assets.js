// assets to be used by the 'hapi-assets' module based on process.env.NODE_ENV
module.exports = {
    development: {
        js: [
            'bower/materialize/dist/js/materialize.min.js',
            'js/handlebars.min.js',
            'js/jquery.ui.widget.js',
            'js/jquery.iframe-transport.js',
            'js/jquery.fileupload.js',
            'js/jquery.fileupload-process.js',
            'js/jquery.fileupload-validate.js',
            'js/HTML5Uploader.js',
            'js/main.js'
        ],
        css: [
            'bower/materialize/dist/css/materialize.min.css',
            'css/main.css'
        ],
        font: [
            'bower/materialize/font/**'
        ]
    },
    production: {
        js: [
            'js/app.js'
        ],
        css: [
            'css/app.css'
        ]
    }
};

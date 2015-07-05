// assets to be used by the 'hapi-assets' module based on process.env.NODE_ENV
module.exports = {
    development: {
        js: [
            'bower/materialize/dist/js/materialize.min.js',
            'bower/handlebars/handlebars.min.js',
            'bower/blueimp-file-upload/js/vendor/jquery.ui.widget.js',
            'bower/blueimp-file-upload/js/jquery.iframe-transport.js',
            'bower/blueimp-file-upload/js/jquery.fileupload.js',
            'bower/blueimp-file-upload/js/jquery.fileupload-process.js',
            'js/jquery.fileupload-validate.js',
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

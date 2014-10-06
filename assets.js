// assets to be used by the 'hapi-assets' module based on process.env.NODE_ENV
module.exports = {
    development: {
        js: [
            'js/handlebars.min.js',
            'js/jquery.ui.widget.js',
            'js/jquery.iframe-transport.js',
            'js/jquery.fileupload.js',
            'js/jquery.fileupload-process.js',
            'js/jquery.fileupload-validate.js',
            'js/HTML5Uploader.js',
            'js/main.js'
        ],
        css: ['css/theme.css'],
        bower: ['bower/font-awesome/css/font-awesome.min.css']
    },
    production: {
        js: ['js/main.js'],
        css: ['css/styles.css']
    }
}
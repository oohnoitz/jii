var fileExtensions = require('../../config').storage.validFileExtensions || [];
var path = require('path');

var reverse = function (string) {
    return string.split('').reverse().join('');
};

exports.sanitizeFilename = function (filename) {
    return filename
        // replace control characters
        .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '_')
        // replace special characters
        .replace(/[;:<>*"\/\\\|]/g, '_');
};

exports.getFileExtension = function (filename) {
    for (var idx = 0, len = fileExtensions.length; idx < len; idx++) {
        if (reverse(filename).indexOf(reverse(fileExtensions[idx])) === 0) {
            return fileExtensions[idx];
        }
    }

    return path.extname(filename);
};

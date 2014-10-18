exports.generateContentDisposition = function(metadata) {
    var header = (metadata.contentType.substr(0, 'application/'.length) === 'application/')
        ? 'attachment' : 'inline';
    if (metadata.filename) {
        // check if non-ascii characters are present (RFC 5987)
        header = /[^\x20-\x7E]/.test(metadata.filename)
          ? header + '; filename="' + encodeURI(metadata.filename) + '"; filename*=UTF-8\'\'' + encodeURI(metadata.filename)
          : header + '; filename="' + metadata.filename + '"';
    }

    return header;
};

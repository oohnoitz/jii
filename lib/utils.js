import path from 'path'
import config from '../config'

const fileExtensions = config.storage.validFileExtensions || []

const reverse = (string) => {
  return string.split('').reverse().join('')
}

const generateContentDisposition = (metadata) => {
  let header = (metadata.contentType.substr(0, 'application/'.length) === 'application/')
      ? 'attachment' : 'inline';
  if (metadata.filename) {
      // check if non-ascii characters are present (RFC 5987)
      header = /[^\x20-\x7E]/.test(metadata.filename)
        ? header + '; filename="' + encodeURI(metadata.filename) + '"; filename*=UTF-8\'\'' + encodeURI(metadata.filename)
        : header + '; filename="' + metadata.filename + '"'
  }

  return header
}

const parseContentDisposition = (string) => {
  let type = null;
  let filename = /filename="(.*?)"/i.exec(string);

  if (filename) {
      filename = decodeURI(filename[1]);
      type = string.split(';')[0]
  }

  return { type, filename };
}

const sanitizeFilename = (filename) => {
  return filename
    // replace control characters
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '_')
    // replace special characters
    .replace(/[;:<>*"\/\\\|]/g, '_')
}

const getFileExtension = (filename) => {
  for (var idx = 0, len = fileExtensions.length; idx < len; idx++) {
    if (reverse(filename).indexOf(reverse(fileExtensions[idx])) === 0) {
      return fileExtensions[idx];
    }
  }

  return path.extname(filename);
}

export default {
  reverse,
  generateContentDisposition,
  parseContentDisposition,
  sanitizeFilename,
  getFileExtension,
}

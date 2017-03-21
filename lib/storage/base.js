import guid from 'shortid'
import rand from 'random-key'
import utils from '../utils'
import config from '../../config'

class BaseFS {
  constructor() {
    this._config = config
    this._storageConfig = config.storage
  }

  new(fileData, fileType) {
    const { name = null, headers: {}, ...payload } = fileData
    const file = {
      _id: guid.generate(),
      filename: rand.generate(),
      mode: 'w',
      content_type: 'application/octet-stream',
      deleteHash: payload['delete-hash'] || rand.generate(),
      crypto: {
        algorithm: payload['crypto-algorithm'] || null,
        passphrase: payload['crypto-passphrase'] || null,
      },
      metadata: {
        secure: Boolean(parseInt(payload['secure']))
      }
    }

    switch (fileType) {
      case 'file':
        file.filename = payload['filename'] || name
        break
      // @TODO: restore upload via link url
      // case 'link':
      //   file.filename = payload['filename'] || utils.parseContentDisposition(headers['content-disposition']).filename || path.basename(payload['link'])
      //   break
      default:
        return {}
    }

    file.filename = utils.sanitizeFilename(file.filename)

    return file
  }
}

export default BaseFS

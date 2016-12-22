import config from '../../config'

import DiskFS from './diskfs'
import GridFS from './gridfs'

function StorageLayer() {
  switch (config.storage.system.type) {
    case 'diskfs':
      return DiskFS
    case 'gridfs':
      return GridFS
  }
}

export default StorageLayer()

import config from '../../config'

function StorageLayer() {
  switch (config.storage.system.type) {
    case 'diskfs':
      return require('./diskfs')
    case 'gridfs':
      return require('./gridfs')
  }
}

export default StorageLayer()

import mongoose from 'mongoose'
import config from '../../config'

const debug = require('debug')('jii::mongodb')
const settings = { server: { auto_reconnect: true } }
const client = mongoose.createConnection(`mongodb://${config.db.host}:${config.db.port}/${config.db.data}`, settings)

client.on('open', function (err) {
  if (err) {
    debug(err)
  } else {
    debug(`connected to database :: ${config.db.data}`);
  }
});

export default client

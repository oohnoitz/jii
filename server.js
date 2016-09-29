import app from './lib/express'
import config from './config'

const debug = require('debug')('jii::server')

app.listen(config.app.port, () => {
  debug(`started server at: ${config.app.host}:${config.app.port}`)
})

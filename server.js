import app from './lib/express'
import config from './config'

const debug = require('debug')('jii::server')
const host = process.env.HOST || config.app.host
const port = process.env.PORT || config.app.port

app.listen(port, host, () => {
  debug(`started server at: ${config.app.host}:${config.app.port}`)
})

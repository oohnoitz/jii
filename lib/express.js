import express from 'express'
import logger from 'morgan'
import bodyParser from 'body-parser'
import methodOverride from 'method-override'
import cors from 'cors'
import compress from 'compression'
import expressWinston from 'express-winston'
import winstonInstance from './winston'
import routes from '../app/routes'
import pug from 'pug'
import { jii } from './jii'

const app = express()

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(compress())
app.use(methodOverride())
app.use(cors())

app.set('view engine', 'pug')

if (app.get('env') === 'development') {
  expressWinston.requestWhitelist.push('body')
  expressWinston.responseWhitelist.push('body')
  app.use(expressWinston.logger({
    winstonInstance,
    msg: 'HTTP {{req.method}} {{req.url}} {{req.statusCode}} {{res.responseTime}}ms',
    colorStatus: true,
  }))
}

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', `${jii.name} ${jii.version}`)
  next()
})
app.use(express.static(`${__dirname}/../public`))
app.use(routes)

export default app

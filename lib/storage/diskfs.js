import bcrypt from 'bcrypt'
import crypto from 'crypto'
import clamav from 'clamav.js'
import detectMime from 'stream-mmmagic'
import passStream from 'pass-stream'
import guid from 'shortid'
import rand from 'random-key'
import mimeType from 'mime-types'
import Gifsicle from 'gifsicle-stream'
import JpegTran from 'jpegtran'
import OptiPng from 'optipng'
import utils from '../utils'
import config from '../../config'

class DiskFS {
  delete(file, cb) {

  }

  find(guid, cb) {

  }

  read(guid, cb) {

  }

  save(file, readStream, cb) {

  }

  processUpload(data, fileStream, cb) {

  }
}

export default DiskFS

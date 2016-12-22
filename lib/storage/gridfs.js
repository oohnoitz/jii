import bcrypt from 'bcrypt'
import crypto from 'crypto'
import clamav from 'clamav.js'
import detectMime from 'stream-mmmagic'
import fs from 'fs'
import passStream from 'pass-stream'
import guid from 'shortid'
import rand from 'random-key'
import mongoose from 'mongoose'
import mongodb from '../db/mongodb'
import mimeType from 'mime-types'
import Grid from 'gridfs-locking-stream'
import Gifsicle from 'gifsicle-stream'
import JpegTran from 'jpegtran'
import OptiPng from 'optipng'
import utils from '../utils'
import config from '../../config'

const debug = require('debug')('jii::gridfs')

import BaseFS from './base'

class GridFS extends BaseFS {
  constructor() {
    super()

    this._gridfs = Grid(mongodb.db, mongoose.mongo)
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

  delete(file, cb) {
    debug('delete', file)
    this._gridfs.remove(file, (err, res) => {
      if (err || res === null) {
        return cb(true)
      }

      return cb(null, res)
    })
  }

  find(guid, cb) {
    debug('find', guid)
    this._gridfs.files.findOne({ _id: guid }, (err, res) => {
      if (err || res === null) {
        return cb(true)
      }

      return cb(null, res)
    })
  }

  read(guid, cb) {
    debug('read', guid)
    this._gridfs.createReadStream({ _id: guid }, (err, readStream) => {
      if (readStream) {
        return cb(null, readStream)
      }

      return cb(true)
    })
  }

  save(file, readStream, cb) {
    debug('save', file)
    if (file.metadata.secure && (!file.crypto.algorithm || !file.crypto.passphrase)) {
      return cb('You did not provide a valid crypto algorithm and/or passphrase.')
    }

    detectMime(readStream, (err, mime, dataStream) => {
      if (err) {
        return cb(err)
      }

      // set default mime value if libmagic fails
      if (mime === null) {
        mime = { type: 'application/octet-stream' }
      }

      // image post-processing optimizations
      let imageProcessingStream = passStream()
      if (this._storageConfig.imageOptimization) {
        switch (mime.type) {
          case 'image/jpeg':
            imageProcessingStream = new JpegTran(['-copy', 'all', '-optimize', '-progressive'])
            break
          case 'image/gif':
            imageProcessingStream = new Gifsicle(['-w', '-O3'])
            break
          case 'image/png':
            imageProcessingStream = new OptiPng()
            break
        }
      }

      // file encryption
      let encryptStream = passStream()
      if (file.metadata.secure && file.crypto.algorithm && file.crypto.passphrase) {
        if (crypto.getCiphers().indexOf(file.crypto.algorithm) === -1) {
          const algorithms = crypto.getCiphers().toString().toUpperCase()

          return cb(`You must use one of the following algorithms: ${algorithms}.`)
        }

        const { algorithm, passphrase: key } = file.crypto
        encryptStream = new cryptostream.EncryptStream({ algorithm, key })
      }

      // store file
      bcrypt.hash(file.deleteHash, 8, (err, hash) => {
        file.content_type = mime.type === 'text/plain'
          ? mimeType.lookup(file.filename) || 'text/plain'
          : mime.type
        file.metadata.deleteHash = hash

        this._gridfs.createWriteStream(file, (err, writeStream) => {
          writeStream.on('error', (err) => {
            return cb(err)
          })

          writeStream.on('close', (res) => {
            return cb(null, res)
          })

          dataStream.pipe(imageProcessingStream).pipe(encryptStream).pipe(writeStream)
        })
      })
    })
  }

  processUpload(data, fileStream, cb) {
    debug('processUpload', data)
    const upload = new Promise((resolve, reject) => {
      this.save(data, fileStream, (err, file) => {
        if (err) {
          return reject({ data, error: 'Upload Error', message: err })
        }

        delete file.aliases
        file.metadata.deleteHash = data.deleteHash
        file.url = `${config.app.uri}${file.metadata.secure ? '/s/' : '/'}${file._id}${utils.getFileExtension(file.filename)}`
        file.deleteUrl = `${config.app.uri}/api/v1/delete/${file._id}/${data.deleteHash}`

        if (config.clamav.enabled === true) {
          this.read(file._id, (err, dataStream) => {
            if (err) {
              console.warn('Unable to scan the file.id: ' + file._id)
              return resolve(file)
            }

            clamav.createScanner(config.clamav.port, config.clamav.host)
              .scan(dataStream, (err, obj, reason) => {
                if (reason) {
                  return reject({
                    data,
                    error: 'Forbidden',
                    message: `This file contains a virus signature. (${reason}).`,
                  })
                }

                return resolve(file)
              })
          })
        } else {
          return resolve(file)
        }
      })
    })

    upload.then((file) => cb(null, file), (error) =>
      this.delete(error.data, (err, res) => cb(error, null))
    )
  }
}

export default GridFS

import bcrypt from 'bcrypt'
import crypto from 'crypto'
import clamav from 'clamav.js'
import detectMime from 'stream-mmmagic'
import fs from 'fs-extra'
import passStream from 'pass-stream'
import guid from 'shortid'
import rand from 'random-key'
import mimeType from 'mime-types'
import Gifsicle from 'gifsicle-stream'
import JpegTran from 'jpegtran'
import OptiPng from 'optipng'
import utils from '../utils'
import config from '../../config'

const debug = require('debug')('jii::diskfs')

import BaseFS from './base'

class DiskFS extends BaseFS {
  delete(file, cb) {

  }

  find(guid, cb) {

  }

  read(guid, cb) {

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
        file.length = 0
        file.uploadDate = (new Date()).getTime()

        let tempFilePath = `/tmp/jii.${guid.generate()}`
        let writeStream = fs.createWriteStream(tempFilePath)
        let checksum = crypto.createHash('sha256').setEncoding('hex')

        encryptStream.on('data', data => {
          file.length += data.length

          writeStream.write(data)
          checksum.write(data)
        })

        encryptStream.on('end', () => {
          writeStream.end()
          checksum.end()

          // store SHA256 checksum
          file.sha256 = checksum.read()

          // presist to disk
          let filePath = `${this._storageConfig.system.path}/${file.sha256.substr(0, 4)}/${file.sha256.substr(4, 8)}/${file.sha256.substr(8, 12)}/${file.sha256.substr(13)}`
          fs.mkdirs(filePath, err => {
            if (err) {
              return cb(err)
            }

            fs.move(tempFilePath, `${filePath}/fileblob`, err => {
              if (err && err.code !== 'EEXIST') {
                return cb(err)
              }

              let metadata = {
                _id: file._id,
                filename: file.filename,
                length: file.length,
                sha256: file.sha256,
                content_type: file.content_type,
                uploadDate: file.uploadDate,
                metadata: {
                  storage: {
                    system: 'DFS',
                    version: 1,
                  }
                }
              }

              fs.writeJson(`${filePath}/metadata`, metadata, err => {
                if (err) {
                  return cb(err)
                }

                return cb(null, file)
              })
            })
          })
        })

        dataStream.pipe(imageProcessingStream).pipe(encryptStream)
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

export default DiskFS

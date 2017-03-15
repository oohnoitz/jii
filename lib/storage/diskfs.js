import bcrypt from 'bcrypt'
import crypto from 'crypto'
import clamav from 'clamav.js'
import detectMime from 'stream-mmmagic'
import fs from 'fs-extra'
import passStream from 'pass-stream'
import guid from 'shortid'
import rand from 'random-key'
import mimeType from 'mime-types'
import postgres from '../db/postgres'
import Gifsicle from 'gifsicle-stream'
import JpegTran from 'jpegtran'
import OptiPng from 'optipng'
import utils from '../utils'
import config from '../../config'

const debug = require('debug')('jii::diskfs')

import BaseFS from './base'

class DiskFS extends BaseFS {
  path(file) {
    const { version } = file.metadata.storage.system
    switch (version) {
      case 1:
        return `${this._storageConfig.system.path}/${file.hash.substr(0, 4)}/${file.hash.substr(4, 4)}/${file.hash.substr(8, 4)}/${file.hash.substr(12)}`
      default:
        return `${this._storageConfig.system.path}/${file.hash.substr(0, 4)}/${file.hash.substr(4, 4)}/${file.hash.substr(8, 4)}/${file.hash.substr(12)}`
    }
  }

  delete(file, cb) {
    debug('delete', file)
    postgres
      .query({text: 'SELECT * FROM files WHERE hash = $1', values: [file.hash]})
      .then((res) => {
        const { rows, rowCount } = res

        if (rowCount === 0) {
          return cb(new Error('Unable to find file by hash.'))
        }

        for (let row of rows) {
          if (row.uuid === file._id) {
            postgres
              .query({text: 'DELETE FROM files WHERE id = $1', values: [row.id]})
              .then(() => {
                const filePath = this.path(row)
                fs.unlink(`${filePath}/metadata.${row.upload_date}`, (err) => {
                  if (err) {
                    return cb(err)
                  }

                  if (rowCount === 1) {
                    fs.unlink(`${filePath}/fileblob`, (err) => {
                      if (err) {
                        return cb(err)
                      }

                      return cb(null, file)
                    })
                  } else {
                    return cb(null, file)
                  }
                })
              }, (err) => {
                return cb(err)
              })
          }
        }
      }, (err) => {
        return cb(err)
      })
  }

  find(guid, cb) {
    debug('find', guid)
    postgres
      .query({text: 'SELECT * FROM files WHERE uuid = $1', values: [guid]})
      .then((res) => {
        const file = res.rows[0]

        if (!file) {
          return cb(new Error('Unable to find file by uuid.'))
        }

        file._id = file.uuid
        file.contentType = file.content_type
        file.uploadDate = new Date(file.upload_date)
        delete file.id
        delete file.uuid
        delete file.content_type
        delete file.upload_date

        return cb(null, file)
      }, (err) => {
        return cb(err)
      })
  }

  read(guid, cb) {
    debug('read', guid)
    postgres
      .query({text: 'SELECT * FROM files WHERE uuid = $1', values: [guid]})
      .then((res) => {
        const file = res.rows[0]

        if (!file) {
          return cb(new Error('Unable to find file by uuid.'))
        }

        const filePath = this.path(file)
        fs.exists(`${filePath}/fileblob`, (exists) => {
          if (!exists) {
            return cb(new Error('Unable to find file in storage.'))
          }

          const readStream = fs.createReadStream(`${filePath}/fileblob`)

          return cb(null, readStream)
        })
      }, (err) => {
        return cb(err)
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

      // perform additional lookup when mime type is text/plain
      mime.type = mime.type === 'text/plain'
        ? mimeType.lookup(file.filename) || 'text/plain'
        : mime.type

      // detect if file is blacklisted
      const { blacklist } = this._storageConfig
      if (blacklist.fileExtensions.includes(utils.getFileExtension(file.filename)) || blacklist.mimeTypes.includes(mime.type)) {
        return cb('This file contains a file extension or mime type that is blacklisted.')
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
        file.content_type = mime.type
        file.length = 0
        file.uploadDate = (new Date()).getTime()
        file.metadata.deleteHash = hash
        file.metadata.storage = {
          system: 'DFS',
          version: this._storageConfig.system.version,
        }

        let tempFilePath = `/tmp/jii.${guid.generate()}`
        let writeStream = fs.createWriteStream(tempFilePath)
        let checksum = crypto.createHash(this._storageConfig.system.algo)

        dataStream.pipe(imageProcessingStream).pipe(encryptStream).pipe(writeStream)

        encryptStream.on('data', data => {
          checksum.update(data)
        })

        writeStream.on('finish', () => {
          file.length = writeStream.bytesWritten
          // store hash checksum
          file.hash = checksum.digest('hex')
          file.algo = this._storageConfig.system.algo

          // presist to disk
          const filePath = this.path(file)
          fs.mkdirs(filePath, err => {
            if (err) {
              return cb(err)
            }

            fs.move(tempFilePath, `${filePath}/fileblob`, err => {
              if (err && err.code !== 'EEXIST') {
                return cb(err)
              }

              if (err && err.code === 'EEXIST') {
                fs.unlinkSync(tempFilePath)
              }

              let metadata = {
                _id: file._id,
                filename: file.filename,
                length: file.length,
                hash: file.hash,
                algo: file.algo,
                content_type: file.content_type,
                uploadDate: file.uploadDate,
                metadata: {
                  storage: file.metadata.storage
                }
              }

              fs.writeJson(`${filePath}/metadata.${file.uploadDate}`, metadata, err => {
                if (err) {
                  return cb(err)
                }

                const query = {
                  text: `INSERT INTO files (uuid, filename, length, hash, algo, content_type, upload_date, metadata, delete_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                  values: [file._id, file.filename, file.length, file.hash, file.algo, file.content_type, file.uploadDate, file.metadata, file.metadata.deleteHash]
                }

                postgres.query(query).then((res) => {
                  return cb(null, file)
                }, (err) => {
                  return cb(err)
                })
              })
            })
          })
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
        file.url = `${config.app.uri}${file.metadata.secure ? '/s/' : '/r/'}${file._id}${utils.getFileExtension(file.filename)}`
        file.deleteUrl = `${config.app.uri}/api/v1/delete/${file._id}/${data.deleteHash}`

        if (config.clamav.enabled === true) {
          this.read(file._id, (err, dataStream) => {
            if (err) {
              // TODO: implement scheduler task to retry scan at a later time
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

    upload.then(file => cb(null, file), error =>
      this.delete(error.data, (err, res) => cb(error.message || err, null))
    )
  }
}

export default DiskFS

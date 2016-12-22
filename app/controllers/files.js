import cryptostream from 'cryptostream'
import passStream from 'pass-stream'
import Storage from '../../lib/storage'
import utils from '../../lib/utils'

const storage = new Storage()

const serveFile = (req, res) => {
  const guid = req.params.guid.split('.')[0]

  storage.find(guid, (err, file) => {
    if (err || file === null) {
      return res.status(404).json({
        statusCode: 404,
        error: 'Not Found'
      })
    }

    storage.read(guid, (err, data) => {
      if (err) {
        res.status(500).json({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'We encountered an unexpected error. Please try again later.'
        })
      }

      var decryptStream = passStream()
      if (file.metadata.secure) {
        const { algorithm = null, passphrase: key = null } = request.params

        decryptStream = new cryptostream.DecryptStream({ algorithm, key })
      }

      // set headers
      res.set({
        'Cache-Control': 'public, must-revalidate, proxy-revalidate',
        'Content-Disposition': utils.generateContentDisposition(file),
        'Content-Length': file.length,
        'Content-Type': (file.contentType || 'application/octet-stream'),
        'ETag': file.md5,
        'Last-Modified': file.uploadDate.toUTCString(),
      })

      data.pipe(res)
    })
  })
}

export default {
  serveFile,
}

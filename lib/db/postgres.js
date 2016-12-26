import { native as pg } from 'pg'
import config from '../../config'

const debug = require('debug')('jii:postgres')

// convert bigint from string to number
pg.types.setTypeParser(20, parseInt)

const query = (input, onRow) => {
  return new Promise((resolve, reject) => {
    pg.connect(config.db, (err, client, done) => {
      if (err) {
        console.log(err)
        done(err)
        return reject(err)
      }

      const resultSet = client.query(input, (err, res) => {
        if (err) {
          console.log(err)
          done(err)
          return reject(err)
        }

        done()
        resolve(res)
      })

      if (typeof onRow === 'function') {
        resultSet.on('row', onRow)
      }
    })
  })
}

export default {
  query,
}

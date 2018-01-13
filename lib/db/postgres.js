import { Pool } from 'pg'
import config from '../../config'

const pg = new Pool({
  connectionString: config.db,
})

const debug = require('debug')('jii:postgres')

const query = (input, onRow) => {
  return new Promise((resolve, reject) => {
    pg.connect((err, client, done) => {
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

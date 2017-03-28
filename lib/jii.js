import cfg from '../config'

const data = {
  cfg: { ...cfg, db: 'REDACTED' },
  jii: require('../../package.json'),
}

export default data

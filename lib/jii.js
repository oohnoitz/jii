import cfg from '../config'

delete cfg.db

const data = {
  cfg,
  jii: require('../../package.json'),
}

export default data

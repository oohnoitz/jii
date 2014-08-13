var Config = require('./config');
var Hapi = require('hapi');
var Path = require('path');

var manifest = {
  pack: {
    app: {
      config: Config
    }
  },
  servers: [
    {
      host: Config.server.api.host,
      port: Config.server.api.port,
      options: {
        labels: 'api',
        cors: {
          additionalHeaders: ['Content-Disposition', 'Content-Range']
        }
      }
    },
    {
      host: Config.server.web.host,
      port: Config.server.web.port,
      options: {
        labels: 'web'
      }
    }
  ],
  plugins: {
    './jii-api': [{ select: 'api' }],
    './jii-web': [{ select: 'web' }]
  }
};

Hapi.Pack.compose(manifest, { relativeTo: Path.join(__dirname, 'node_modules') }, function (err, pack) {
  pack.start();
})

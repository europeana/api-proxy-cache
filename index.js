const config = require('./src/config');

const elasticApmNode = require('elastic-apm-node');
const elasticApmOptions = {
  ...config.elasticApm,
  frameworkName: 'Express.js',
  frameworkVersion: require('express/package.json').version,
  serviceName: 'api-proxy-cache',
  serviceVersion: require('./package').version
};
if (elasticApmOptions.serverUrl) elasticApmNode.start(elasticApmOptions);

const express = require('express');
const apicache = require('apicache');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const redis = require('redis');

const apicacheOptions = {
  debug: config.enable.apicacheDebug
};

if (config.redis.url) {
  apicacheOptions.redisClient = redis.createClient(config.redis);
}

const app = express();

app.use(cors());
if (config.enable.logging) app.use(morgan('combined'));
if (config.enable.compression) app.use(compression());

const cache = apicache.options(apicacheOptions).middleware;

app.get('/', (req, res) => {
  res.type('text/plain');
  res.send('OK');
});

const onlyStatus200 = (req, res) => res.statusCode === 200;
const cacheSuccesses = cache(config.cacheDuration, onlyStatus200);

for (const path in config.proxy) {
  const target = config.proxy[path];
  app.use(
    path,
    cacheSuccesses,
    createProxyMiddleware({
      changeOrigin: true,
      target
    })
  );
}

const server = app.listen(config.port, () => {
  console.log('Listening on port ' + server.address().port);
});

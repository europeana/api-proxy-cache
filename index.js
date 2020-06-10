require('dotenv').config();

const { cosmiconfigSync } = require('cosmiconfig');

const express = require('express');
const apicache = require('apicache');
const morgan = require('morgan');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const redis = require('redis');

const loadRuntimeConfiguration = () => {
  let rc = {};

  if (process.env['PROXY_RC']) {
    rc = JSON.parse(process.env['PROXY_RC']);
  } else {
    const configSearch = cosmiconfigSync('proxy').search();
    if (configSearch) rc = configSearch.config;
  }

  return rc;
};

const apicacheOptions = {
  debug: Number(process.env.ENABLE_APICACHE_DEBUG)
};

if (process.env.REDIS_URL) {
  const redisOptions = {
    url: process.env.REDIS_URL
  };
  if (process.env.REDIS_TLS_CA) {
    redisOptions.tls = {
      ca: [Buffer.from(process.env.REDIS_TLS_CA, 'base64')]
    };
  }
  apicacheOptions.redisClient = redis.createClient(redisOptions);
}

const app = express();

app.use(cors());
app.use(morgan('combined'));

const cache = apicache.options(apicacheOptions).middleware;

app.get('/', (req, res) => {
  res.type('text/plain');
  res.send('OK');
});

const onlyStatus200 = (req, res) => res.statusCode === 200;
const cacheSuccesses = cache(process.env.CACHE_DURATION || '5 minutes', onlyStatus200);

const rc = loadRuntimeConfiguration();
for (const path in rc) {
  const target = rc[path];
  app.use(
    path,
    cacheSuccesses,
    createProxyMiddleware({
      target,
      changeOrigin: true
    })
  );
}

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + server.address().port);
});

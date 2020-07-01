require('dotenv').config();

const elasticApmNode = require('elastic-apm-node');
const elasticApmOptions = {
  serviceName: 'api-proxy-cache',
  serviceVersion: require('./package').version,
  serverUrl: process.env['ELASTIC_APM_SERVER_URL'],
  environment: process.env['ELASTIC_APM_ENVIRONMENT'] || 'development',
  logLevel: process.env['ELASTIC_APM_LOG_LEVEL'] || 'info',
  frameworkName: 'Express.js',
  frameworkVersion: require('express/package.json').version
};
if (elasticApmOptions.serverUrl) elasticApmNode.start(elasticApmOptions);

const { cosmiconfigSync } = require('cosmiconfig');
const express = require('express');
const apicache = require('apicache');
const morgan = require('morgan');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const redis = require('redis');

const flatten = require('lodash/flatten');
const compact = require('lodash/compact');
const uniq = require('lodash/uniq');

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

let redisClient;
if (process.env.REDIS_URL) {
  const redisOptions = {
    url: process.env.REDIS_URL
  };
  if (process.env.REDIS_TLS_CA) {
    redisOptions.tls = {
      ca: [Buffer.from(process.env.REDIS_TLS_CA, 'base64')]
    };
  }
  redisClient = redis.createClient(redisOptions);
  apicacheOptions.redisClient = redisClient;
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

// Gathers all sys.id properties at any depth of an object
const getSysIds = (data) => {
  let sysIds = [];
  if (Array.isArray(data)) {
    sysIds = data.map(getSysIds);
  } else if (typeof data === 'object') {
    for (const key in data) {
      if (key === 'sys' && data.sys.id) {
        sysIds = sysIds.concat(data.sys.id);
      } else {
        sysIds = sysIds.concat(getSysIds(data[key]));
      }
    }
  }
  return compact(uniq(flatten(sysIds)));
};

// Write sys.ids in proxied response to Redis
//
// TODO: add an app endpoint with authorisation to clear all relevant cache
//       entries when a given sys id changes, to be called by a webhook.
// TODO: account somehow for creation/publication of new content, e.g. for
//       content listing queries, perhaps by also indexing the content types
//       included in responses
const onProxyRes = (proxyRes, req) => {
  // TODO: only do this if it's JSON, and if redis client is configured
  let rawData = '';
  proxyRes.on('data', (chunk) => {
    rawData += chunk;
  });
  proxyRes.on('end', () => {
    const parsedData = JSON.parse(rawData);
    const sysIds = getSysIds(parsedData);

    for (const id of sysIds) {
      const redisKey = `/index/${id}`;
      redisClient.get(redisKey, (err, res) => {
        const index = (res ? JSON.parse(res) : []).concat(req.url);
        const redisValue = JSON.stringify(index);
        redisClient.set(redisKey, redisValue);
      });
    }
  });
};

const rc = loadRuntimeConfiguration();
for (const path in rc) {
  const target = rc[path];
  app.use(
    path,
    cacheSuccesses,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      onProxyRes
    })
  );
}

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + server.address().port);
});

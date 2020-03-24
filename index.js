require('dotenv').config();

// TODO: use cluster-service?

const express = require('express');
const apicache = require('apicache');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const redis = require('redis');

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

const cache = apicache.options(apicacheOptions).middleware;

app.get('/', (req, res) => {
  res.type('text/plain');
  res.send('OK');
});

app.use(
  `/spaces/${process.env.CTF_SPACE_ID}/environments/${process.env.CTF_ENVIRONMENT_ID}/`,
  cache(process.env.CACHE_DURATION || '5 minutes'),
  createProxyMiddleware({
    target: 'https://cdn.contentful.com/',
    changeOrigin: true
  })
);

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + server.address().port);
});

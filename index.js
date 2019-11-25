require('dotenv').config();

const express = require('express');
const apicache = require('apicache');
const cors = require('cors');
const proxy = require('http-proxy-middleware');
const redis = require('redis');

const redisOptions = {
  url: process.env.REDIS_URL
};
if (process.env.REDIS_TLS_CA) {
  redisOptions.tls = {
    ca: [Buffer.from(process.env.REDIS_TLS_CA, 'base64')]
  };
}

const app = express();

app.use(cors());

const cache = apicache.options({
  redisClient: redis.createClient(redisOptions)
}).middleware;

app.use(
  `/spaces/${process.env.CTF_SPACE_ID}/environments/${process.env.CTF_ENVIRONMENT_ID}/`,
  cache('5 minutes'),
  proxy({
    target: 'https://cdn.contentful.com/',
    changeOrigin: true,
    headers: { authorization: `Bearer ${process.env.CTF_CDA_ACCESS_TOKEN}` }
  })
);

const server = app.listen(process.env.PORT || 3000, function() {
  console.log('Listening on port ' + server.address().port);
});

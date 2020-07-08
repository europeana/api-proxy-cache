require('dotenv').config();

const { cosmiconfigSync } = require('cosmiconfig');

const loadProxyRuntimeConfiguration = () => {
  let rc = {};

  if (process.env['PROXY_RC']) {
    rc = JSON.parse(process.env['PROXY_RC']);
  } else {
    const configSearch = cosmiconfigSync('proxy').search();
    if (configSearch) rc = configSearch.config;
  }

  return rc;
};

const redisConfig = () => {
  const redisOptions = {};

  if (process.env.REDIS_URL) {
    redisOptions.url = process.env.REDIS_URL;

    if (process.env.REDIS_TLS_CA) {
      redisOptions.tls = {
        ca: [Buffer.from(process.env.REDIS_TLS_CA, 'base64')]
      };
    }
  }

  return redisOptions;
};

module.exports = {
  cacheDuration: process.env.CACHE_DURATION || '5 minutes',
  elasticApm: {
    environment: process.env['ELASTIC_APM_ENVIRONMENT'] || 'development',
    logLevel: process.env['ELASTIC_APM_LOG_LEVEL'] || 'info',
    serverUrl: process.env['ELASTIC_APM_SERVER_URL']
  },
  enable: {
    apicacheDebug: Number(process.env.ENABLE_APICACHE_DEBUG),
    compression: Number(process.env.ENABLE_COMPRESSION),
    logging: !Number(process.env.DISABLE_LOGGING)
  },
  port: process.env.PORT || 3000,
  proxy: loadProxyRuntimeConfiguration(),
  redis: redisConfig()
};

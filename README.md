# api-proxy-cache

[Express](https://expressjs.com/) web application to proxy requests to APIs and
cache their responses in Redis.

## Configure

Copy [.proxyrc.json.example](.proxyrc.json.example) to .proxyrc.json and
adapt for your environment.

## NPM

### Install

```
npm install --save @europeana/api-proxy-cache
```

### Run

```
npx europeana-api-proxy-cache
```

## Docker

### Build

```
docker build -t europeana/api-proxy-cache .
```

### Run

```
docker run -it \
  --mount type=bind,source="$(pwd)"/.proxyrc.json,target=/app/.proxyrc.json \
  --env-file .env \
  -p 3001:3001 \
  europeana/api-proxy-cache
```

## License

Licensed under the EUPL v1.2.

For full details, see [LICENSE.md](LICENSE.md).

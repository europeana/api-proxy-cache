FROM node:14-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN NODE_ENV=production npm ci

COPY index.js *.md ./
COPY src ./src


FROM gcr.io/distroless/nodejs:14

ENV PORT=8080 \
    HOST=0.0.0.0 \
    NODE_ENV=production

EXPOSE ${PORT}

WORKDIR /app

COPY --from=base /app .

USER 1000

CMD ["index.js"]

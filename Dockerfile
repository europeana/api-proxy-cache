FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS base

WORKDIR /app

COPY package*.json ./

RUN NODE_ENV=production npm ci

COPY index.js *.md ./
COPY src ./src


FROM gcr.io/distroless/nodejs24-debian13@sha256:78f07ef1b5ea71ad7c055df15d0dd8997f2d288f9158623c4d4ae3d765b7d50d

ENV PORT=8080 \
    HOST=0.0.0.0 \
    NODE_ENV=production

EXPOSE ${PORT}

WORKDIR /app

COPY --from=base /app .

USER 1000

CMD ["index.js"]

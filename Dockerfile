FROM node:12-alpine

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

WORKDIR /app

COPY . .

RUN npm install

ENTRYPOINT ["npm", "run", "start"]

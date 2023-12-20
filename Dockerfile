FROM node:18.15.0-alpine AS build
RUN mkdir /app
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn
COPY src src
COPY server server
COPY bin bin

RUN chown -R node:node server/uploads
USER node
ENV PORT=8080
EXPOSE 8080
CMD ["server/index.js"]

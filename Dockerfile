FROM node:18-alpine AS build
RUN mkdir /app
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn
COPY src src
COPY server server
COPY bin bin

FROM gcr.io/distroless/nodejs:18
WORKDIR /app
COPY --from=build /app .
ENV PORT=8080
EXPOSE 8080
CMD ["server/index.js"]

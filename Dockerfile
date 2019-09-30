FROM node:10
WORKDIR /usr/src/app

COPY package*.json ./
RUN yarn

COPY . .
EXPOSE 8080
ENV PORT=8080
CMD ["yarn", "start"]

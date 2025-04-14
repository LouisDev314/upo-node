FROM node:20

WORKDIR /app

COPY . /app

RUN npm install --production && npm run build

EXPOSE 3000

CMD ["npm", "start"]

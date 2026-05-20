FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY app.js ./
COPY config ./config
COPY public ./public
COPY scripts ./scripts
COPY utils ./utils
COPY views ./views

EXPOSE 5000

CMD ["npm", "start"]

FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/app.js ./
COPY backend/config ./config
COPY backend/public ./public
COPY backend/scripts ./scripts
COPY backend/utils ./utils
COPY backend/views ./views

EXPOSE 5000

CMD ["npm", "start"]

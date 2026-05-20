FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY app.js ./
COPY config ./config
COPY public ./public
COPY scripts ./scripts
COPY utils ./utils
COPY views ./views

RUN mkdir -p /app/public/uploads/courses

EXPOSE 5000

CMD ["node", "app.js"]

FROM node:24-alpine
# mysql-client ใช้ทำ Backup/Restore, tzdata ให้เวลาเป็นเวลาไทย
RUN apk add --no-cache mysql-client tzdata
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]

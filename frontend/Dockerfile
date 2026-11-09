FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# ที่อยู่ backend ใน network ของ Docker (ใช้ใน rewrites ของ next.config.mjs)
ENV API_URL=http://backend:5000
# ไม่ส่งสถิติการใช้งานของ Next.js (build ตอนออฟไลน์ได้ไม่ต้องรอเน็ต)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  reactStrictMode: true,
  // ปิดปุ่ม dev indicator ของ Next (Next 16.4 มี bug ทำให้ console ขึ้น warning ตอนโหลดหน้า)
  devIndicators: false,
  // ส่งต่อ /api/... ไปที่ backend (API_URL: ตอนรันบนเครื่อง = localhost:5000, ใน Docker = http://backend:5000)
  async rewrites() {
    const api = process.env.API_URL || "http://localhost:5000";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
  // ตัวส่งต่อของ Next รับ body ได้ 10MB เป็นค่าเริ่มต้น (เกินแล้วไฟล์ถูกตัด)
  // เพิ่มให้มากกว่าขีดจำกัดของ backend (10MB) เพื่อให้ backend เป็นผู้ตอบ error เอง
  experimental: { proxyClientMaxBodySize: "20mb" },
};

export default nextConfig;

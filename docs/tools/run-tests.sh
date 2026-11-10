#!/bin/sh
# ทดสอบคู่มือกับระบบจริง (รันใน Git Bash)
#   sh run-tests.sh dev              ใช้ MySQL ทดสอบแยก (eva_api_test, port 13306) + backend/next dev ชั่วคราว ไม่แตะ eva_mysql
#   sh run-tests.sh docker --wipe    ใช้ระบบที่รันด้วย docker compose (port 3000/5000) **ล้างข้อมูลใน eva_mysql ทั้งหมด**
#   sh run-tests.sh capture          เก็บ request/response จริงของทุกเส้นลง captures.json (ใช้ในแผนที่ API)
cd "$(dirname "$0")" || exit 1
ROOT=$(cd ../.. && pwd)
WROOT=$(cygpath -m "$ROOT" 2>/dev/null || echo "$ROOT")
[ -n "$APP_ROOT" ] && WROOT=$APP_ROOT   # ทดสอบโปรเจกต์อื่นแทนโค้ดเฉลย
MODE=${1:-dev}
mkdir -p .out

# จำไฟล์ใน uploads/backups ก่อนเริ่ม แล้วลบเฉพาะไฟล์ที่การทดสอบสร้างตอนจบ
node -e '
const fs = require("fs"), R = process.argv[1];
fs.writeFileSync(".out/keep.json", JSON.stringify({ uploads: fs.readdirSync(R + "/backend/uploads"), backups: fs.existsSync(R + "/backend/backups") ? fs.readdirSync(R + "/backend/backups") : [] }));
' "$WROOT"
cleanup() {
  node -e '
const fs = require("fs"), R = process.argv[1], keep = JSON.parse(fs.readFileSync(".out/keep.json", "utf8"));
for (const d of ["uploads", "backups"]) { const dir = R + "/backend/" + d; if (!fs.existsSync(dir)) continue; for (const f of fs.readdirSync(dir)) if (!keep[d].includes(f)) fs.rmSync(dir + "/" + f); }
' "$WROOT"
}

start_test_db() {
  docker rm -f eva_api_test >/dev/null 2>&1
  MSYS_NO_PATHCONV=1 docker run -d --name eva_api_test -e MYSQL_ROOT_PASSWORD=testpw -e MYSQL_DATABASE=eva_test -e TZ=Asia/Bangkok \
    -p 127.0.0.1:13306:3306 -v "$WROOT/backend/sql:/docker-entrypoint-initdb.d:ro" mysql:8.4 \
    --mysql-native-password=ON --authentication-policy=mysql_native_password \
    --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci >/dev/null || exit 1
  i=0
  until echo "SELECT COUNT(*) FROM users" | docker exec -i eva_api_test sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE' >/dev/null 2>&1; do
    i=$((i + 1)); [ $i -gt 90 ] && { echo "MySQL ทดสอบไม่พร้อม"; exit 1; }; sleep 2
  done
}

case "$MODE" in
  dev)
    start_test_db
    KEEP_UPLOADS=1 node replay.mjs > .out/replay.txt 2>&1
    grep -E '^FAIL|ERROR|สรุป' .out/replay.txt
    node ui-test.mjs > .out/ui-test.txt 2>&1
    grep -E '^FAIL|Console error|สรุป|^  \[' .out/ui-test.txt
    docker rm -f eva_api_test >/dev/null
    ;;
  docker)
    [ "$2" = "--wipe" ] || { echo "โหมดนี้ล้างข้อมูลใน eva_mysql ทั้งหมด ต้องพิมพ์: sh run-tests.sh docker --wipe"; exit 1; }
    docker exec eva_mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < /docker-entrypoint-initdb.d/schema.sql' 2>/dev/null || exit 1
    API_BASE=http://localhost:5000/api SQL_CONTAINER=eva_mysql KEEP_UPLOADS=1 node replay.mjs > .out/replay.txt 2>&1
    grep -E '^FAIL|ERROR|สรุป' .out/replay.txt
    DOCKER=1 SQL_CONTAINER=eva_mysql node ui-test.mjs > .out/ui-test.txt 2>&1
    grep -E '^FAIL|Console error|สรุป|^  \[' .out/ui-test.txt
    # คืนฐานข้อมูลเป็นตารางเปล่า
    docker exec eva_mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < /docker-entrypoint-initdb.d/schema.sql' 2>/dev/null
    ;;
  capture)
    start_test_db
    node flow.mjs
    docker rm -f eva_api_test >/dev/null
    ;;
  *) echo "ใช้: sh run-tests.sh dev | docker --wipe | capture"; exit 1 ;;
esac
cleanup
echo "ผลเต็มอยู่ที่ docs/tools/.out/"

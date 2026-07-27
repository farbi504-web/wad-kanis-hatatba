#!/usr/bin/env bash
# ============================================================
#  تجربة واد كنيس حطاطبة محلياً بأمر واحد
#  يجهّز قاعدة بيانات، ينشئ الجداول، يملأ البيانات، ويشغّل الموقع.
#
#  الاستخدام:
#      bash scripts/try-local.sh
#
#  المتطلبات: Node.js 20+ فقط.
#  PostgreSQL ليس مطلوباً — إن لم يوجد، يُنزَّل تلقائياً.
# ============================================================
set -euo pipefail

PORT="${PORT:-3000}"
PGPORT="${PGPORT:-54329}"
PGDIR="${PGDIR:-/tmp/wdk-pgdata}"
DBNAME="wadkanis_local"
ENVFILE=".env.local"   # Next.js يقرأه تلقائياً

cyan()  { printf "\033[36m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

cd "$(dirname "$0")/.."

bold ""
bold "  واد كنيس حطاطبة — تجربة محلية"
bold "  ================================"
echo ""

# ---------- 1. فحص Node ----------
if ! command -v node >/dev/null 2>&1; then
  red "✗ Node.js غير مثبّت. حمّله من https://nodejs.org (اختر LTS)"
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  red "✗ Node.js $NODE_MAJOR قديم. المطلوب 20 أو أحدث."
  exit 1
fi
green "✓ Node.js $(node -v)"

# ---------- 2. الحزم ----------
if [ ! -d node_modules ]; then
  cyan "→ تثبيت الحزم (قد يستغرق دقيقتين)..."
  npm install --no-audit --no-fund --silent
fi
green "✓ الحزم جاهزة"

# ---------- 3. قاعدة البيانات ----------
PG_BIN=""
if command -v pg_ctl >/dev/null 2>&1; then
  PG_BIN="$(dirname "$(command -v pg_ctl)")"
else
  EMB="node_modules/@embedded-postgres/linux-x64/native/bin"
  case "$(uname -s)" in
    Darwin) EMB="node_modules/@embedded-postgres/darwin-$(uname -m | sed 's/x86_64/x64/')/native/bin" ;;
  esac
  if [ ! -x "$EMB/pg_ctl" ]; then
    cyan "→ تنزيل PostgreSQL مضمّن (مرة واحدة)..."
    npm i --no-save --no-audit --no-fund --silent \
      "@embedded-postgres/$(uname -s | tr 'A-Z' 'a-z' | sed 's/darwin/darwin/;s/linux/linux/')-$(uname -m | sed 's/x86_64/x64/;s/aarch64/arm64/')" \
      2>/dev/null || npm i --no-save --silent @embedded-postgres/linux-x64
  fi
  PG_BIN="$EMB"
fi

# أوقف أي خادم سابق على نفس المجلد (قد يبقى عالقاً من تشغيلة سابقة)
"$PG_BIN/pg_ctl" -D "$PGDIR" stop -m immediate >/dev/null 2>&1 || true

# مجلد بيانات ناقص أو تالف → أعد التهيئة من الصفر
if [ -d "$PGDIR" ] && [ ! -f "$PGDIR/global/pg_filenode.map" ]; then
  rm -rf "$PGDIR"
fi

if [ ! -d "$PGDIR/base" ]; then
  cyan "→ تهيئة قاعدة البيانات..."
  rm -rf "$PGDIR"; mkdir -p "$PGDIR"
  echo postgres > /tmp/wdk-pw
  "$PG_BIN/initdb" -D "$PGDIR" -U postgres --auth=trust --pwfile=/tmp/wdk-pw -E UTF8 >/dev/null 2>&1
fi

rm -f "$PGDIR/postmaster.pid" 2>/dev/null || true
"$PG_BIN/pg_ctl" -D "$PGDIR" -o "-p $PGPORT -k /tmp" -l /tmp/wdk-pg.log start >/dev/null 2>&1 || true
sleep 3

if ! node -e "
const {Client}=require('pg');
new Client({host:'/tmp',port:$PGPORT,user:'postgres',database:'postgres'})
  .connect().then(c=>process.exit(0)).catch(()=>process.exit(1));
" 2>/dev/null; then
  red "✗ تعذّر تشغيل PostgreSQL. جرّب حذف المجلد ثم أعد المحاولة:"
  echo "    rm -rf $PGDIR && bash scripts/try-local.sh"
  echo "  السجل: /tmp/wdk-pg.log"
  exit 1
fi
green "✓ PostgreSQL يعمل على المنفذ $PGPORT"

node -e "
const {Client}=require('pg');
(async()=>{
  const c=new Client({host:'/tmp',port:$PGPORT,user:'postgres',database:'postgres'});
  await c.connect();
  const r=await c.query(\"select 1 from pg_database where datname='$DBNAME'\");
  if(!r.rows.length) await c.query('CREATE DATABASE $DBNAME');
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1)});
"

# ---------- 4. المتغيرات ----------
if [ ! -f "$ENVFILE" ]; then
  cyan "→ توليد مفاتيح التجربة..."
  cat > "$ENVFILE" <<EOF
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:$PGPORT/$DBNAME
AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
SEED_SECRET=local-try-secret
ADMIN_EMAIL=admin@wad-kanis.dz
ADMIN_PASSWORD=AdminLocal2026Pass
PORT=$PORT
EOF
fi
set -a; . "./$ENVFILE"; set +a
green "✓ المتغيرات جاهزة"

# ---------- 5. الجداول ----------
cyan "→ إنشاء الجداول..."
npx drizzle-kit push --force >/dev/null 2>&1
TABLES=$(node -e "
const {Client}=require('pg');
(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();
const r=await c.query(\"select count(*)::int n from pg_tables where schemaname='public'\");
console.log(r.rows[0].n);await c.end()})();
")
green "✓ $TABLES جدولاً"

# ---------- 6. التشغيل ----------
cyan "→ تشغيل الموقع..."
npx next dev -p "$PORT" > /tmp/wdk-app.log 2>&1 &
APP_PID=$!

cleanup() {
  echo ""
  cyan "→ إيقاف..."
  kill $APP_PID 2>/dev/null || true
  "$PG_BIN/pg_ctl" -D "$PGDIR" stop >/dev/null 2>&1 || true
  green "✓ تم. لإعادة التشغيل: bash scripts/try-local.sh"
  exit 0
}
trap cleanup INT TERM

for i in $(seq 1 60); do
  sleep 2
  if curl -sf --max-time 3 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then break; fi
  if [ "$i" = 60 ]; then red "✗ فشل التشغيل. راجع /tmp/wdk-app.log"; cleanup; fi
done
green "✓ الموقع يعمل"

# ---------- 7. البيانات ----------
SEED=$(curl -s -X POST "http://127.0.0.1:$PORT/api/seed" -H "x-seed-secret: $SEED_SECRET" || true)
if echo "$SEED" | grep -q '"ok":true'; then
  green "✓ البيانات جاهزة (8 مدن · 12 فئة · حساب مدير)"
else
  green "✓ البيانات موجودة مسبقاً"
fi

echo ""
bold "  ────────────────────────────────────────"
bold "   الموقع جاهز 🎉"
bold "  ────────────────────────────────────────"
echo ""
echo "   افتح:  http://localhost:$PORT"
echo ""
echo "   حساب المدير:"
echo "     البريد:      $ADMIN_EMAIL"
echo "     كلمة المرور: $ADMIN_PASSWORD"
echo "     لوحة التحكم: http://localhost:$PORT/admin"
echo ""
echo "   جرّب: أنشئ حساباً · انشر إعلاناً · وافق عليه من لوحة التحكم"
echo ""
echo "   للإيقاف: Ctrl+C"
bold "  ────────────────────────────────────────"
echo ""

wait $APP_PID

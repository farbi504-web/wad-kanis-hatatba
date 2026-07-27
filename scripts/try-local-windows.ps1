# ============================================================
#  تجربة واد كنيس حطاطبة على ويندوز
#
#  الاستخدام: انقر بالزر الأيمن على هذا الملف ثم
#             "Run with PowerShell"
#
#  أو من PowerShell:
#      powershell -ExecutionPolicy Bypass -File scripts\try-local-windows.ps1
#
#  المتطلب الوحيد: Node.js 20+  من https://nodejs.org
# ============================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Port   = 3000
$PgPort = 54329
$DbName = "wadkanis_local"
$EnvFile = ".env.local"   # Next.js يقرأه تلقائيا

function Cyan($t)  { Write-Host $t -ForegroundColor Cyan }
function Green($t) { Write-Host $t -ForegroundColor Green }
function Red($t)   { Write-Host $t -ForegroundColor Red }

# الانتقال لمجلد المشروع
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host ""
Write-Host "  واد كنيس حطاطبة - تجربة محلية" -ForegroundColor White
Write-Host "  ================================" -ForegroundColor White
Write-Host ""

# ---------- 1. فحص Node ----------
try {
    $nodeVer = (node -p "process.versions.node") 2>$null
} catch {
    Red "X  Node.js غير مثبت."
    Write-Host "   حمله من: https://nodejs.org  (اختر LTS)"
    Write-Host ""
    Read-Host "اضغط Enter للخروج"
    exit 1
}
$major = [int]($nodeVer -split '\.')[0]
if ($major -lt 20) {
    Red "X  Node.js $nodeVer قديم. المطلوب 20 أو أحدث."
    Read-Host "اضغط Enter للخروج"
    exit 1
}
Green "OK  Node.js v$nodeVer"

# ---------- 2. الحزم ----------
if (-not (Test-Path "node_modules")) {
    Cyan "->  تثبيت الحزم (دقيقتان تقريبا)..."
    npm install --no-audit --no-fund --silent
}
Green "OK  الحزم جاهزة"

# ---------- 3. PostgreSQL ----------
$pgBin = "node_modules\@embedded-postgres\windows-x64\native\bin"
if (-not (Test-Path "$pgBin\pg_ctl.exe")) {
    Cyan "->  تنزيل PostgreSQL مضمن (مرة واحدة، قد ياخذ دقيقة)..."
    npm install --no-save --no-audit --no-fund --silent "@embedded-postgres/windows-x64"
}
if (-not (Test-Path "$pgBin\pg_ctl.exe")) {
    Red "X  فشل تنزيل PostgreSQL."
    Read-Host "اضغط Enter للخروج"
    exit 1
}

$pgData = Join-Path $env:TEMP "wdk-pgdata"

# اوقف اي خادم عالق من تشغيلة سابقة
& "$pgBin\pg_ctl.exe" -D $pgData stop -m immediate 2>&1 | Out-Null

# مجلد بيانات تالف او ناقص -> اعد التهيئة
if ((Test-Path $pgData) -and (-not (Test-Path "$pgData\global\pg_filenode.map"))) {
    Remove-Item -Recurse -Force $pgData -ErrorAction SilentlyContinue
}

if (-not (Test-Path "$pgData\base")) {
    Cyan "->  تهيئة قاعدة البيانات..."
    if (Test-Path $pgData) { Remove-Item -Recurse -Force $pgData -ErrorAction SilentlyContinue }
    New-Item -ItemType Directory -Path $pgData -Force | Out-Null
    $pwFile = Join-Path $env:TEMP "wdk-pw.txt"
    "postgres" | Out-File -FilePath $pwFile -Encoding ascii -NoNewline
    & "$pgBin\initdb.exe" -D $pgData -U postgres --auth=trust --pwfile=$pwFile -E UTF8 2>&1 | Out-Null
}

Remove-Item "$pgData\postmaster.pid" -Force -ErrorAction SilentlyContinue
$pgLog = Join-Path $env:TEMP "wdk-pg.log"
& "$pgBin\pg_ctl.exe" -D $pgData -o "-p $PgPort" -l $pgLog start 2>&1 | Out-Null
Start-Sleep -Seconds 4

# تحقق من الاتصال فعليا
$probe = @"
const {Client}=require('pg');
new Client({host:'127.0.0.1',port:$PgPort,user:'postgres',password:'postgres',database:'postgres'})
  .connect().then(()=>process.exit(0)).catch(()=>process.exit(1));
"@
$probe | Out-File -FilePath "$env:TEMP\wdk-probe.js" -Encoding utf8
node "$env:TEMP\wdk-probe.js"
if ($LASTEXITCODE -ne 0) {
    Red "X  تعذر تشغيل PostgreSQL."
    Write-Host "   احذف المجلد ثم اعد المحاولة:"
    Write-Host "     Remove-Item -Recurse -Force `"$pgData`""
    Write-Host "   السجل: $pgLog"
    Read-Host "اضغط Enter للخروج"
    exit 1
}
Green "OK  PostgreSQL يعمل على المنفذ $PgPort"

# إنشاء قاعدة البيانات
$createDb = @"
const {Client}=require('pg');
(async()=>{
  const c=new Client({host:'127.0.0.1',port:$PgPort,user:'postgres',password:'postgres',database:'postgres'});
  await c.connect();
  const r=await c.query("select 1 from pg_database where datname='$DbName'");
  if(!r.rows.length) await c.query('CREATE DATABASE $DbName');
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1)});
"@
$createDb | Out-File -FilePath "$env:TEMP\wdk-createdb.js" -Encoding utf8
node "$env:TEMP\wdk-createdb.js"

# ---------- 4. المتغيرات ----------
if (-not (Test-Path $EnvFile)) {
    Cyan "->  توليد مفاتيح التجربة..."
    $authSecret = node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
    $encKey     = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    $encSalt    = node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
    @"
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:$PgPort/$DbName
AUTH_SECRET=$authSecret
ENCRYPTION_KEY=$encKey
ENCRYPTION_SALT=$encSalt
SEED_SECRET=local-try-secret
ADMIN_EMAIL=admin@wad-kanis.dz
ADMIN_PASSWORD=AdminLocal2026Pass
PORT=$Port
"@ | Out-File -FilePath $EnvFile -Encoding utf8 -NoNewline
}

# تحميل المتغيرات في الجلسة
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([A-Z_]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
    }
}
Green "OK  المتغيرات جاهزة"

# ---------- 5. الجداول ----------
Cyan "->  إنشاء الجداول..."
npx drizzle-kit push --force 2>&1 | Out-Null

# يُكتب في ملف مؤقت لتفادي مشاكل الاقتباس والهروب في PowerShell
$countJs = @'
const {Client}=require('pg');
(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL});
  await c.connect();
  const r=await c.query("select count(*)::int n from pg_tables where schemaname='public'");
  console.log(r.rows[0].n);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1)});
'@
$countJs | Out-File -FilePath "$env:TEMP\wdk-count.js" -Encoding utf8
$tables = node "$env:TEMP\wdk-count.js"
Green "OK  $tables جدولا"

# ---------- 6. التشغيل ----------
Cyan "->  تشغيل الموقع..."
$appLog = Join-Path $env:TEMP "wdk-app.log"
$app = Start-Process -FilePath "npx" -ArgumentList "next","dev","-p","$Port" `
       -NoNewWindow -PassThru -RedirectStandardOutput $appLog -RedirectStandardError "$appLog.err"

$ready = $false
foreach ($i in 1..60) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 3 -UseBasicParsing
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}

if (-not $ready) {
    Red "X  فشل التشغيل. راجع: $appLog"
    if ($app -and -not $app.HasExited) { Stop-Process -Id $app.Id -Force }
    & "$pgBin\pg_ctl.exe" -D $pgData stop 2>&1 | Out-Null
    Read-Host "اضغط Enter للخروج"
    exit 1
}
Green "OK  الموقع يعمل"

# ---------- 7. البيانات ----------
try {
    $seed = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$Port/api/seed" `
            -Headers @{"x-seed-secret"="local-try-secret"} -TimeoutSec 60
    Green "OK  البيانات جاهزة (8 مدن - 12 فئة - حساب مدير)"
} catch {
    Green "OK  البيانات موجودة مسبقا"
}

Write-Host ""
Write-Host "  ----------------------------------------" -ForegroundColor White
Write-Host "   الموقع جاهز" -ForegroundColor Green
Write-Host "  ----------------------------------------" -ForegroundColor White
Write-Host ""
Write-Host "   افتح:  http://localhost:$Port"
Write-Host ""
Write-Host "   حساب المدير:"
Write-Host "     البريد:      admin@wad-kanis.dz"
Write-Host "     كلمة المرور: AdminLocal2026Pass"
Write-Host "     لوحة التحكم: http://localhost:$Port/admin"
Write-Host ""
Write-Host "   جرب: انشئ حسابا - انشر اعلانا - وافق عليه من لوحة التحكم"
Write-Host ""
Write-Host "   للايقاف: اغلق هذه النافذة او اضغط Ctrl+C"
Write-Host "  ----------------------------------------" -ForegroundColor White
Write-Host ""

# فتح المتصفح تلقائيا
Start-Process "http://localhost:$Port"

# الانتظار حتى الاغلاق
try {
    Wait-Process -Id $app.Id
} finally {
    Cyan "->  ايقاف..."
    if ($app -and -not $app.HasExited) { Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue }
    & "$pgBin\pg_ctl.exe" -D $pgData stop 2>&1 | Out-Null
    Green "OK  تم."
}

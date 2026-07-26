# 🚀 دليل النشر - واد كنيس حطاطبة

## نظرة عامة
منصة إعلانات مبوبة لمدينة حطاطبة، تيبازة والمناطق المجاورة في الجزائر.

## المتطلبات الأساسية

### للسيرفر (VPS):
- Ubuntu 22.04 LTS أو أحدث
- 2GB RAM minimum (4GB موصى به)
- 20GB مساحة تخزين
- Node.js 20.x أو أحدث
- PostgreSQL 14+
- Nginx
- Domain + SSL Certificate

### للنشر على Vercel/Railway:
- حساب GitHub
- حساب Vercel/Railway
- PostgreSQL منفصل (Supabase/Neon)

## خطوات النشر السريعة

### 1. على Vercel (الأسهل)

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# النشر
vercel --prod
```

ثم أضف المتغيرات في Vercel Dashboard.

### 2. على VPS خاص

```bash
# 1. إعداد السيرفر
bash scripts/server-setup.sh

# 2. إعداد قاعدة البيانات
sudo -u postgres psql < scripts/setup-production-db.sql

# 3. استنساخ المشروع
sudo -u wdk git clone YOUR_REPO /var/www/wad-kanis

# 4. إعداد المتغيرات
sudo -u wdk cp .env.production.example /var/www/wad-kanis/.env
sudo -u wdk nano /var/www/wad-kanis/.env

# 5. تثبيت المكتبات
cd /var/www/wad-kanis
sudo -u wdk npm ci

# 6. بناء التطبيق
sudo -u wdk npm run build

# 7. تطبيق Schema
sudo -u wdk npx drizzle-kit push

# 8. إعداد Nginx
sudo cp scripts/nginx-wad-kanis.conf /etc/nginx/sites-available/wad-kanis
sudo ln -s /etc/nginx/sites-available/wad-kanis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 9. SSL (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com

# 10. Systemd Service
sudo cp scripts/wad-kanis.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable wad-kanis
sudo systemctl start wad-kanis

# 11. التحقق
curl https://yourdomain.com/api/health
```

## المتغيرات البيئية المطلوبة

راجع `.env.production.example` للقيم الكاملة.

**المتغيرات الأساسية:**
- `DATABASE_URL` - رابط PostgreSQL
- `AUTH_SECRET` - مفتاح JWT (64+ حرف)
- `ENCRYPTION_KEY` - مفتاح التشفير (32 bytes hex)
- `ENCRYPTION_SALT` - ملح التشفير
- `SEED_SECRET` - مفتاح API التهيئة
- `FORCE_SECURE_COOKIE=1` - للـ HTTPS

## توليد المفاتيح

```bash
# AUTH_SECRET
openssl rand -base64 48

# ENCRYPTION_KEY
openssl rand -hex 32

# ENCRYPTION_SALT
openssl rand -hex 16

# SEED_SECRET
openssl rand -base64 48
```

## الأوامر اليومية

### مراقبة الخدمة
```bash
# حالة الخدمة
sudo systemctl status wad-kanis

# السجلات
sudo journalctl -u wad-kanis -f

# آخر 100 سطر
sudo journalctl -u wad-kanis -n 100
```

### النسخ الاحتياطي
```bash
# نسخ يدوي
bash scripts/backup-cron.sh

# إضافة Cron Job
echo "0 3 * * * /var/www/wad-kanis/scripts/backup-cron.sh" | sudo crontab -
```

### التحديث والنشر
```bash
bash scripts/deploy.sh
```

## المراقبة والتنبيهات

### 1. Health Check
```bash
curl https://yourdomain.com/api/health
```

### 2. Error Monitoring
استخدم [Sentry](https://sentry.io):
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest
```

### 3. Analytics
استخدم [Plausible](https://plausible.io) أو [Umami](https://umami.is):
- لا حاجة لـ Cookie banner
- احترام الخصوصية
- يعمل في الجزائر

## الأمان

✅ **تم تطبيق:**
- HTTPS إلزامي
- Password hashing (bcrypt)
- 2FA اختياري
- Rate limiting
- CSRF protection
- SQL injection prevention
- XSS prevention
- Session management آمن
- Audit logging
- Encrypted sensitive data

## الدعم

📧 admin@wad-kanis.dz
🌐 https://wad-kanis.dz

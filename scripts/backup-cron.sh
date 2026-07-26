#!/bin/bash
# ============================================
# Automated Backup Script
# أضفه إلى crontab: 0 3 * * * /var/www/wad-kanis/scripts/backup-cron.sh
# ============================================

set -e

APP_DIR="/var/www/wad-kanis"
BACKUP_DIR="/var/backups/wad-kanis"
DATE=$(date +%Y%m%d_%H%M%S)
MAX_BACKUPS=7

mkdir -p $BACKUP_DIR

# 1. نسخ قاعدة البيانات
echo "📦 Backing up database..."
DB_URL=$(grep DATABASE_URL $APP_DIR/.env | cut -d'=' -f2- | tr -d '"')
pg_dump "$DB_URL" | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# 2. نسخ ملفات الرفع
echo "📁 Backing up uploads..."
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C $APP_DIR/public uploads/

# 3. حذف النسخ القديمة (الاحتفاظ بآخر 7)
echo "🧹 Cleaning old backups..."
ls -1t $BACKUP_DIR/db_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS+1)) | xargs -r rm
ls -1t $BACKUP_DIR/uploads_*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS+1)) | xargs -r rm

# 4. تشفير النسخة (اختياري)
# gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/db_$DATE.sql.gz

echo "✅ Backup completed: $DATE"
echo "📊 Backup size:"
du -sh $BACKUP_DIR/*$DATE*

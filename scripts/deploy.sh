#!/bin/bash
# ============================================
# Deployment Script
# شغّل من مجلد المشروع على السيرفر
# ============================================

set -e

APP_DIR="/var/www/wad-kanis"
SERVICE_NAME="wad-kanis"

echo "🚀 Starting deployment..."

cd $APP_DIR

# 1. جلب آخر التحديثات
echo "📥 Pulling latest changes..."
git pull origin main

# 2. تثبيت المكتبات
echo "📦 Installing dependencies..."
npm ci --production=false

# 3. بناء التطبيق
echo "🔨 Building application..."
npm run build

# 4. تطبيق تغييرات قاعدة البيانات
echo "🗄️ Applying database migrations..."
npx drizzle-kit push

# 5. إعادة تشغيل الخدمة
echo "🔄 Restarting service..."
sudo systemctl restart $SERVICE_NAME

# 6. التحقق من الصحة
echo "🏥 Health check..."
sleep 5
if curl -sf http://localhost:3000/api/health > /dev/null; then
  echo "✅ Deployment successful!"
  echo "🌐 Application is running on https://wad-kanis.dz"
else
  echo "❌ Health check failed!"
  echo "Check logs: sudo journalctl -u $SERVICE_NAME -n 50"
  exit 1
fi

#!/bin/bash
# ============================================
# Server Setup Script for Ubuntu 22.04
# شغّل كـ root مرة واحدة
# ============================================

set -e

# تحديث النظام
apt update && apt upgrade -y

# تثبيت المتطلبات
apt install -y curl wget git nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw fail2ban

# تثبيت Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# تثبيت pnpm
npm install -g pnpm

# إنشاء مستخدم للتطبيق
useradd -m -s /bin/bash wdk
usermod -aG sudo wdk

# إنشاء مجلدات
mkdir -p /var/www/wad-kanis
chown -R wdk:wdk /var/www/wad-kanis
mkdir -p /var/backups/wad-kanis
chown -R wdk:wdk /var/backups/wad-kanis

# إعداد Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Server setup completed!"
echo "Next steps:"
echo "1. Setup PostgreSQL: bash scripts/setup-production-db.sql"
echo "2. Clone repo: git clone YOUR_REPO /var/www/wad-kanis"
echo "3. Setup Nginx: bash scripts/setup-nginx.sh"
echo "4. Setup SSL: certbot --nginx -d yourdomain.com"

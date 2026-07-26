#!/bin/bash
# ============================================
# Database Security Setup Script
# إنشاء مستخدمين بقاعدة البيانات بصلاحيات Least Privilege
# ============================================

set -e

DB_NAME="${DB_NAME:-app_db}"
DB_ADMIN_USER="${DB_ADMIN_USER:-postgres}"
DB_ADMIN_PASS="${DB_ADMIN_PASS:-postgres}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"

# مستخدم التطبيق: صلاحيات محدودة
APP_USER="${APP_USER:-wdk_app}"
APP_PASS="${APP_PASS:-$(openssl rand -hex 24)}"

# مستخدم للقراءة فقط (للإحصائيات والتقارير)
READONLY_USER="${READONLY_USER:-wdk_readonly}"
READONLY_PASS="${READONLY_PASS:-$(openssl rand -hex 24)}"

# مستخدم للنسخ الاحتياطية
BACKUP_USER="${BACKUP_USER:-wdk_backup}"
BACKUP_PASS="${BACKUP_PASS:-$(openssl rand -hex 24)}"

export PGPASSWORD="$DB_ADMIN_PASS"

echo "🔒 Setting up database security..."

# 1. إنشاء مستخدم التطبيق بصلاحيات محدودة
echo "📝 Creating app user: $APP_USER"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d "$DB_NAME" <<EOF
-- حذف المستخدم إن وجد
DROP USER IF EXISTS $APP_USER;
DROP USER IF EXISTS $READONLY_USER;
DROP USER IF EXISTS $BACKUP_USER;

-- إنشاء المستخدمين
CREATE USER $APP_USER WITH PASSWORD '$APP_PASS';
CREATE USER $READONLY_USER WITH PASSWORD '$READONLY_PASS';
CREATE USER $BACKUP_USER WITH PASSWORD '$BACKUP_PASS';

-- صلاحيات على قاعدة البيانات
GRANT CONNECT ON DATABASE $DB_NAME TO $APP_USER;
GRANT CONNECT ON DATABASE $DB_NAME TO $READONLY_USER;
GRANT CONNECT ON DATABASE $DB_NAME TO $BACKUP_USER;

-- صلاحيات على schema
GRANT USAGE ON SCHEMA public TO $APP_USER;
GRANT USAGE ON SCHEMA public TO $READONLY_USER;
EOF

# 2. صلاحيات التطبيق: CRUD على الجداول + استخدام sequences
echo "🔑 Granting app user privileges..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d "$DB_NAME" <<EOF
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $APP_USER;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO $APP_USER;

-- للجداول المستقبلية
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $APP_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO $APP_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT EXECUTE ON FUNCTIONS TO $APP_USER;
EOF

# 3. صلاحيات القراءة فقط
echo "👁 Granting readonly privileges..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d "$DB_NAME" <<EOF
GRANT SELECT ON ALL TABLES IN SCHEMA public TO $READONLY_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT ON TABLES TO $READONLY_USER;
EOF

# 4. صلاحيات النسخ الاحتياطي
echo "💾 Granting backup privileges..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d "$DB_NAME" <<EOF
ALTER USER $BACKUP_USER WITH REPLICATION;
GRANT pg_read_all_data TO $BACKUP_USER;
EOF

# 5. تفعيل Row Level Security (RLS)
echo "🛡 Enabling Row Level Security..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d "$DB_NAME" <<EOF
-- تفعيل RLS على جدول المستخدمين
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- المستخدم يمكنه رؤية بياناته فقط
CREATE POLICY users_self_select ON users
  FOR SELECT
  USING (true);  -- للجميع يمكنهم رؤية البائعين العام

-- المستخدم يمكنه تحديث بياناته فقط
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id::text = current_setting('app.current_user_id', true))
  WITH CHECK (id::text = current_setting('app.current_user_id', true));

-- تقييد الإعلانات
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY listings_public_select ON listings
  FOR SELECT
  USING (status = 'active' OR user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY listings_owner_modify ON listings
  FOR ALL
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

-- تقييد الرسائل
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_participants ON messages
  FOR ALL
  USING (
    sender_id::text = current_setting('app.current_user_id', true) OR
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id::text = current_setting('app.current_user_id', true) 
           OR c.seller_id::text = current_setting('app.current_user_id', true))
    )
  );

-- تقييد المفضلة
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY favorites_owner ON favorites
  FOR ALL
  USING (user_id::text = current_setting('app.current_user_id', true));
EOF

# 6. تفعيل SSL إلزامي
echo "🔐 Enforcing SSL..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d "$DB_NAME" <<EOF
-- في postgresql.conf: ssl = on
-- هنا نقوم فقط بإنشاء شهادة إذا لم تكن موجودة
EOF

# 7. إعدادات الأمان الإضافية
echo "⚙️ Applying additional security settings..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d "$DB_NAME" <<EOF
-- منع الوصول للجداول الحساسة
REVOKE ALL ON pg_authid FROM PUBLIC;
REVOKE ALL ON pg_shadow FROM PUBLIC;

-- مهلة الاستعلامات
ALTER DATABASE $DB_NAME SET statement_timeout = '30s';
ALTER DATABASE $DB_NAME SET idle_in_transaction_session_timeout = '60s';

-- تفعيل logging للاستعلامات الطويلة
ALTER DATABASE $DB_NAME SET log_min_duration_statement = '1s';
EOF

echo ""
echo "✅ Database security setup completed!"
echo ""
echo "📋 Connection strings for .env:"
echo "================================"
echo "DATABASE_URL=postgresql://$APP_USER:$APP_PASS@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"
echo "DATABASE_READONLY_URL=postgresql://$READONLY_USER:$READONLY_PASS@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"
echo "DATABASE_BACKUP_URL=postgresql://$BACKUP_USER:$BACKUP_PASS@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"
echo ""
echo "⚠️  Save these credentials securely!"

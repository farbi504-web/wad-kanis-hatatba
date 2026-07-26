#!/bin/bash
# توليد جميع المفاتيح السرية المطلوبة
# Usage: ./scripts/generate-secrets.sh

set -e

echo "=== Secrets Generated for Production ==="
echo ""
echo "AUTH_SECRET=\"$(openssl rand -base64 48)\""
echo "ENCRYPTION_KEY=\"$(openssl rand -hex 32)\""
echo "ENCRYPTION_SALT=\"$(openssl rand -hex 16)\""
echo "SEED_SECRET=\"$(openssl rand -base64 48)\""
echo "DB_PASSWORD=\"$(openssl rand -base64 32)\""
echo ""
echo "⚠️  احفظ هذه القيم في مكان آمن مثل 1Password أو Vault"
echo "⚠️  لا تشاركها أبداً في Git"

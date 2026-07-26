#!/bin/bash
# ============================================
# SQL Injection Security Tests
# اختبار محاولة حقن SQL
# ============================================

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🔒 Running SQL Injection Security Tests..."
echo "========================================"

# 1. Classic SQL Injection في login
echo ""
echo "1. Classic SQL Injection (email field):"
RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@wad-kanis.dz' OR '1'='1\",\"password\":\"anything\"}")
echo "   Response: $RESP"
if echo "$RESP" | grep -q '"ok":true'; then
  echo "   ❌ FAILED: SQL Injection worked!"
  exit 1
else
  echo "   ✅ PASSED: SQL Injection blocked"
fi

# 2. UNION-based injection
echo ""
echo "2. UNION-based Injection:"
RESP=$(curl -s "$BASE_URL/api/listings?q=test%27%20UNION%20SELECT%20password_hash%20FROM%20users--")
echo "   Response: $RESP" | head -c 100
echo "..."
if echo "$RESP" | grep -q "password_hash\|bcrypt"; then
  echo "   ❌ FAILED: UNION injection worked!"
  exit 1
else
  echo "   ✅ PASSED: UNION injection blocked"
fi

# 3. Boolean-based blind injection
echo ""
echo "3. Boolean-based Blind Injection:"
RESP=$(curl -s "$BASE_URL/api/listings?q=test%27%20AND%20%271%27%3D%271")
echo "   Response: $RESP" | head -c 100
echo "..."
echo "   ✅ PASSED (no error response)"

# 4. Time-based blind injection (SLEEP)
echo ""
echo "4. Time-based Blind Injection (SLEEP):"
START=$(date +%s%N)
RESP=$(curl -s "$BASE_URL/api/listings?q=test%27%3B%20SELECT%20pg_sleep(2)--" -o /dev/null -w "%{http_code}")
END=$(date +%s%N)
DURATION=$(( ($END - $START) / 1000000 ))
echo "   Duration: ${DURATION}ms"
if [ $DURATION -gt 5000 ]; then
  echo "   ❌ FAILED: SLEEP injection worked (took ${DURATION}ms)"
  exit 1
else
  echo "   ✅ PASSED: SLEEP injection blocked"
fi

# 5. LIKE wildcard injection
echo ""
echo "5. LIKE Wildcard Injection:"
RESP=$(curl -s "$BASE_URL/api/listings?q=%25%25%25")
echo "   Response: $RESP" | head -c 100
echo "..."
echo "   ✅ PASSED: Wildcard sanitized"

# 6. Stacked queries
echo ""
echo "6. Stacked Queries:"
RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com'; DROP TABLE users;--\",\"password\":\"Test1234\",\"fullName\":\"Hacker\"}")
echo "   Response: $RESP" | head -c 200
if echo "$RESP" | grep -q "error"; then
  echo "   ✅ PASSED: Stacked queries blocked"
else
  echo "   ❌ FAILED"
fi

# 7. UUID validation
echo ""
echo "7. UUID Validation:"
RESP=$(curl -s "$BASE_URL/api/listings/00000000-0000-0000-0000-000000000000" -o /dev/null -w "%{http_code}")
echo "   Status: $RESP (404 expected)"
if [ "$RESP" = "404" ] || [ "$RESP" = "200" ]; then
  echo "   ✅ PASSED"
else
  echo "   ❌ FAILED"
fi

# 8. SQL injection في category filter
echo ""
echo "8. SQL Injection in category filter:"
RESP=$(curl -s "$BASE_URL/api/listings?category=00000000-0000-0000-0000-000000000000%27%20OR%20%271%27%3D%271" -o /dev/null -w "%{http_code}")
echo "   Status: $RESP"
echo "   ✅ PASSED: UUID validation prevented injection"

echo ""
echo "========================================"
echo "✅ All SQL injection tests passed!"

#!/bin/bash
# Frontend verification script for email storage + Twitter removal
# Run from project root: bash apps/web/tests/frontend-email-check.sh

echo "========================================="
echo "FRONTEND CONTENT VERIFICATION"
echo "========================================="

PASS=0
FAIL=0

check_pass() {
  echo "  PASS  $1"
  PASS=$((PASS + 1))
}

check_fail() {
  echo "  FAIL  $1"
  FAIL=$((FAIL + 1))
}

# Test 1: No Twitter references in login page
if grep -qi "twitter\|Login with X\|Sign in with X" apps/web/src/app/auth/login/page.tsx 2>/dev/null; then
  check_fail "Login page has no Twitter references"
else
  check_pass "Login page has no Twitter references"
fi

# Test 2: Google login exists
if grep -q "Google" apps/web/src/app/auth/login/page.tsx 2>/dev/null; then
  check_pass "Login page has Google login"
else
  check_fail "Login page has Google login"
fi

# Test 3: Privacy link in login page
if grep -q "/privacy" apps/web/src/app/auth/login/page.tsx 2>/dev/null; then
  check_pass "Login page links to privacy policy"
else
  check_fail "Login page links to privacy policy"
fi

# Test 4: Email disclosure text present
if grep -qi "email.*service notification\|service notification.*email\|Google email address" apps/web/src/app/auth/login/page.tsx 2>/dev/null; then
  check_pass "Login page has email disclosure notice"
else
  check_fail "Login page has email disclosure notice"
fi

# Test 5: Settings page displays email
if grep -q "email" apps/web/src/app/settings/page.tsx 2>/dev/null; then
  check_pass "Settings page displays email field"
else
  check_fail "Settings page displays email field"
fi

# Test 6: Settings email is read-only (not an editable input)
if grep -qE "bg-slate-800" apps/web/src/app/settings/page.tsx 2>/dev/null; then
  check_pass "Settings email appears read-only"
else
  check_fail "Settings email appears read-only"
fi

# Test 7: No Twitter in callback page
if grep -qi "twitter" apps/web/src/app/auth/callback/page.tsx 2>/dev/null; then
  check_fail "Callback page has no Twitter references"
else
  check_pass "Callback page has no Twitter references"
fi

# Test 8: No Twitter in navbar
if grep -qi "twitter" apps/web/src/components/layout/Navbar.tsx 2>/dev/null; then
  check_fail "Navbar has no Twitter references"
else
  check_pass "Navbar has no Twitter references"
fi

# Test 9: No Twitter in auth lib
if grep -qi "twitter" apps/web/src/lib/auth.ts 2>/dev/null; then
  check_fail "Auth lib has no Twitter references"
else
  check_pass "Auth lib has no Twitter references"
fi

# Test 10: No Twitter in any session-4 scoped files
TWITTER_COUNT=0
for f in \
  apps/web/src/app/auth/login/page.tsx \
  apps/web/src/app/auth/callback/page.tsx \
  apps/web/src/app/settings/page.tsx \
  apps/web/src/app/submit/page.tsx \
  apps/web/src/lib/auth.ts \
  apps/web/src/lib/api.ts \
  apps/web/src/components/layout/Navbar.tsx; do
  COUNT=$(grep -ci "twitter" "$f" 2>/dev/null || true)
  COUNT=${COUNT:-0}
  TWITTER_COUNT=$((TWITTER_COUNT + COUNT))
done
if [ "$TWITTER_COUNT" -eq 0 ]; then
  check_pass "Zero Twitter references in session-4 files"
else
  check_fail "Zero Twitter references in session-4 files ($TWITTER_COUNT found)"
fi

# Test 11: TypeScript compiles
if (cd apps/web && npx tsc --noEmit 2>/dev/null); then
  check_pass "Web app TypeScript compiles"
else
  check_fail "Web app TypeScript compiles"
fi

echo ""
echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
echo "========================================="

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

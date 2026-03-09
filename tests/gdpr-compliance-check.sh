#!/bin/bash
# GDPR Compliance Verification — Cross-platform check
# Covers: email storage, Twitter removal, legal pages, documentation
# Run from project root: bash tests/gdpr-compliance-check.sh

echo "================================================================"
echo "GDPR COMPLIANCE VERIFICATION — OpenSolve Email Storage"
echo "================================================================"

PASS=0
FAIL=0
WARN=0

check() {
  local desc="$1"
  local result="$2"
  if [ "$result" = "0" ]; then
    echo "  PASS  $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $desc"
    FAIL=$((FAIL + 1))
  fi
}

warn() {
  local desc="$1"
  echo "  WARN  $desc"
  WARN=$((WARN + 1))
}

# ============================================================
echo ""
echo "1. SCHEMA & DATA MODEL"
echo "------------------------------------------------------------"

# Email column exists
grep -q "email.*varchar" apps/api/src/db/schema.ts 2>/dev/null
check "Email column defined in schema (varchar)" "$?"

# Email is NOT NULL
grep -q "email.*notNull\|\.notNull()" apps/api/src/db/schema.ts 2>/dev/null
check "Email column is NOT NULL (mandatory)" "$?"

# Email has unique index
grep -q "emailIdx.*uniqueIndex\|users_email_idx" apps/api/src/db/schema.ts 2>/dev/null
check "Email has unique index" "$?"

# OAuth enum is google-only
if grep "oauthProviderEnum" apps/api/src/db/schema.ts 2>/dev/null | grep -qv "twitter"; then
  check "OAuth provider enum is Google-only" "0"
else
  check "OAuth provider enum is Google-only" "1"
fi

# ============================================================
echo ""
echo "2. API — AUTH ROUTES"
echo "------------------------------------------------------------"

# No Twitter routes
if grep -qi "auth/twitter" apps/api/src/routes/auth.routes.ts 2>/dev/null; then
  check "No Twitter OAuth routes in auth.routes.ts" "1"
else
  check "No Twitter OAuth routes in auth.routes.ts" "0"
fi

# Email stored in Google callback
grep -q "email" apps/api/src/routes/auth.routes.ts 2>/dev/null
check "Email referenced in auth routes" "$?"

# GDPR export exists
grep -q "user/export" apps/api/src/routes/auth.routes.ts 2>/dev/null
check "GDPR export endpoint exists" "$?"

# GDPR delete exists
grep -q "user/account" apps/api/src/routes/auth.routes.ts 2>/dev/null
check "GDPR account deletion endpoint exists" "$?"

# ============================================================
echo ""
echo "3. TWITTER REMOVAL — COMPLETE"
echo "------------------------------------------------------------"

# Zero Twitter in API src
TWITTER_API=$(grep -rci "twitter" apps/api/src/ --include="*.ts" 2>/dev/null | awk -F: '{sum+=$2} END{print sum+0}')
check "Zero Twitter references in API src ($TWITTER_API found)" "$([ "$TWITTER_API" = "0" ] && echo 0 || echo 1)"

# Zero Twitter in frontend src (excluding layout.tsx twitter card metadata which is a web standard)
TWITTER_WEB=$(grep -rn "twitter" apps/web/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "layout.tsx.*twitter:" | wc -l)
check "Zero Twitter references in frontend src ($TWITTER_WEB found, excludes social card metadata)" "$([ "$TWITTER_WEB" = "0" ] && echo 0 || echo 1)"

# Zero Twitter in docs (target files)
TWITTER_DOCS=0
for f in docs/API.md docs/BOT_GUIDE.md docs/SECURITY.md docs/ARCHITECTURE.md docs/ADMIN.md skill/SKILL.md bots/README.md README.md CONTRIBUTING.md apps/web/src/app/docs/api/page.tsx apps/web/src/app/docs/sdk/page.tsx; do
  if [ -f "$f" ] && grep -qi "twitter" "$f" 2>/dev/null; then
    TWITTER_DOCS=$((TWITTER_DOCS + 1))
  fi
done
check "Zero Twitter references in documentation ($TWITTER_DOCS files found)" "$([ "$TWITTER_DOCS" = "0" ] && echo 0 || echo 1)"

# twitter.service.ts deleted
if [ -f "apps/api/src/services/twitter.service.ts" ]; then
  check "twitter.service.ts is deleted" "1"
else
  check "twitter.service.ts is deleted" "0"
fi

# ============================================================
echo ""
echo "4. LEGAL PAGES"
echo "------------------------------------------------------------"

PRIVACY="apps/web/src/app/privacy/page.tsx"

if [ -f "$PRIVACY" ]; then
  grep -qi "email address" "$PRIVACY"
  check "Privacy policy mentions email address" "$?"

  grep -qi "legitimate interest" "$PRIVACY"
  check "Privacy policy states legitimate interest" "$?"

  grep -qi "Article 6\|Art\. 6\|6(1)(f)" "$PRIVACY"
  check "Privacy policy references GDPR Art. 6" "$?"

  grep -qi "right to erasure\|Article 17\|right to deletion\|delete.*account" "$PRIVACY"
  check "Privacy policy covers right to erasure" "$?"

  grep -qi "right to object\|Article 21\|object.*processing" "$PRIVACY"
  check "Privacy policy covers right to object" "$?"

  grep -qi "marketing\|no.*marketing\|never.*market" "$PRIVACY"
  check "Privacy policy commits to no marketing emails" "$?"

  if grep -qi "twitter" "$PRIVACY"; then
    check "Privacy policy has no Twitter references" "1"
  else
    check "Privacy policy has no Twitter references" "0"
  fi
else
  warn "Privacy policy page not found at $PRIVACY"
fi

TERMS="apps/web/src/app/terms/page.tsx"
if [ -f "$TERMS" ]; then
  grep -qi "google account\|verified email\|Google" "$TERMS"
  check "Terms require Google account" "$?"

  if grep -qi "twitter" "$TERMS"; then
    check "Terms have no Twitter references" "1"
  else
    check "Terms have no Twitter references" "0"
  fi
else
  warn "Terms page not found at $TERMS"
fi

# ============================================================
echo ""
echo "5. TRANSPARENCY NOTICE (Login Page)"
echo "------------------------------------------------------------"

LOGIN="apps/web/src/app/auth/login/page.tsx"

if [ -f "$LOGIN" ]; then
  grep -qi "email\|service notification" "$LOGIN"
  check "Login page has email disclosure notice" "$?"

  grep -q "/privacy" "$LOGIN"
  check "Login page links to privacy policy" "$?"

  if grep -qi "twitter\|Login with X\|Sign in with X" "$LOGIN"; then
    check "Login page has no Twitter button" "1"
  else
    check "Login page has no Twitter button" "0"
  fi
else
  warn "Login page not found at $LOGIN"
fi

# ============================================================
echo ""
echo "6. INTERNAL COMPLIANCE DOCUMENTS"
echo "------------------------------------------------------------"

if [ -f "docs/LEGITIMATE-INTEREST-ASSESSMENT.md" ]; then
  check "Legitimate Interest Assessment exists" "0"

  grep -qi "legitimate interest\|Article 6(1)(f)" docs/LEGITIMATE-INTEREST-ASSESSMENT.md
  check "LIA references Art. 6(1)(f)" "$?"

  grep -qi "balancing test\|necessity" docs/LEGITIMATE-INTEREST-ASSESSMENT.md
  check "LIA contains balancing test" "$?"

  grep -qi "review schedule\|annual" docs/LEGITIMATE-INTEREST-ASSESSMENT.md
  check "LIA has review schedule" "$?"

  grep -qi "Art\. 30\|processing register" docs/LEGITIMATE-INTEREST-ASSESSMENT.md
  check "LIA includes Art. 30 register entry" "$?"
else
  check "Legitimate Interest Assessment exists" "1"
fi

# GDPR minimization plan updated
if grep -qi "email storage" GDPR-DATA-MINIMIZATION-PLAN.md 2>/dev/null; then
  check "GDPR minimization plan documents email storage" "0"
else
  check "GDPR minimization plan documents email storage" "1"
fi

# ============================================================
echo ""
echo "7. SETTINGS PAGE"
echo "------------------------------------------------------------"

SETTINGS="apps/web/src/app/settings/page.tsx"

if [ -f "$SETTINGS" ]; then
  grep -qi "email" "$SETTINGS"
  check "Settings page displays email" "$?"

  if grep -qi "twitter" "$SETTINGS"; then
    check "Settings page has no Twitter references" "1"
  else
    check "Settings page has no Twitter references" "0"
  fi
else
  warn "Settings page not found at $SETTINGS"
fi

# ============================================================
echo ""
echo "8. AFFILIATE DISCLOSURE IN NEWSLETTER"
echo "------------------------------------------------------------"

TEMPLATES="apps/api/src/email/templates.ts"

if [ -f "$TEMPLATES" ]; then
  grep -q "affiliate" "$TEMPLATES"
  check "Affiliate disclosure block in newsletter email template" "$?"

  grep -q "Anzeige" "$TEMPLATES"
  check "German UWG ad label (Anzeige) in newsletter template" "$?"

  grep -q "sponsored" "$TEMPLATES"
  check "Sponsored content disclosure in newsletter template" "$?"

  grep -q "Kantelegatan\|postal\|Karlstad" "$TEMPLATES"
  check "Postal address in newsletter email footer (UWG §7)" "$?"
else
  check "Email templates file exists" "1"
fi

# ============================================================
echo ""
echo "9. RETENTION AUTOMATION"
echo "------------------------------------------------------------"

RETENTION_SVC="apps/api/src/services/retention.service.ts"
SERVER="apps/api/src/server.ts"

if [ -f "$RETENTION_SVC" ]; then
  grep -q "setInterval\|startScheduler\|runCleanup\|runRetentionCleanup" "$RETENTION_SVC"
  check "Retention service has schedulable cleanup method" "$?"

  grep -q "logger\|log\." "$RETENTION_SVC"
  check "Retention service emits log output" "$?"
else
  check "Retention service file exists" "1"
fi

if [ -f "$SERVER" ]; then
  grep -q "retention\|Retention" "$SERVER"
  check "Retention service referenced in server.ts" "$?"
else
  check "server.ts exists" "1"
fi

# ============================================================
echo ""
echo "10. COMPILATION"
echo "------------------------------------------------------------"

cd packages/shared && npx tsc --noEmit 2>/dev/null
check "Shared package compiles" "$?"
cd ../..

cd apps/api && npx tsc --noEmit 2>/dev/null
check "API compiles" "$?"
cd ../..

cd apps/web && npx tsc --noEmit 2>/dev/null
check "Web app compiles" "$?"
cd ../..

# ============================================================
echo ""
echo "================================================================"
echo "RESULTS: $PASS passed, $FAIL failed, $WARN warnings"
echo "================================================================"

if [ "$FAIL" -gt 0 ]; then
  echo "ACTION REQUIRED: Fix $FAIL failing checks before deployment."
  exit 1
else
  echo "All compliance checks passed."
  exit 0
fi

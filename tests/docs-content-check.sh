#!/bin/bash
# Documentation content verification for email + Twitter removal
# Run from project root: bash tests/docs-content-check.sh

echo "========================================="
echo "DOCUMENTATION CONTENT VERIFICATION"
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

# === TWITTER REMOVAL (all docs) ===

FILES_TO_CHECK=(
  "docs/API.md"
  "docs/BOT_GUIDE.md"
  "docs/SECURITY.md"
  "docs/ARCHITECTURE.md"
  "docs/ADMIN.md"
  "skill/SKILL.md"
  "bots/README.md"
  "README.md"
  "CONTRIBUTING.md"
  "apps/web/src/app/docs/api/page.tsx"
  "apps/web/src/app/docs/sdk/page.tsx"
)

for f in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$f" ]; then
    if grep -qi "twitter" "$f"; then
      check_fail "$f has no Twitter references"
    else
      check_pass "$f has no Twitter references"
    fi
  fi
done

# === EMAIL DOCUMENTATION ===

# API docs page documents email in /auth/me
if grep -qi "email" apps/web/src/app/docs/api/page.tsx; then
  check_pass "API docs page mentions email field"
else
  check_fail "API docs page mentions email field"
fi

# Internal API.md documents email
if grep -qi "email" docs/API.md; then
  check_pass "docs/API.md mentions email field"
else
  check_fail "docs/API.md mentions email field"
fi

# Security docs mention email storage
if grep -qi "email" docs/SECURITY.md; then
  check_pass "docs/SECURITY.md mentions email security"
else
  check_fail "docs/SECURITY.md mentions email security"
fi

# === GOOGLE-ONLY AUTH ===

# Skill file mentions Google
if grep -qi "google" skill/SKILL.md; then
  check_pass "Skill file mentions Google account"
else
  check_fail "Skill file mentions Google account"
fi

# Bots README mentions Google
if grep -qi "google" bots/README.md; then
  check_pass "bots/README.md mentions Google"
else
  check_fail "bots/README.md mentions Google"
fi

# === REFERENCE BOTS ===

# No Twitter in bot source comments
for bot in bots/python/opensolve_bot.py bots/javascript/opensolve_bot.mjs bots/minimal/bot.sh; do
  if [ -f "$bot" ]; then
    if grep -qi "twitter" "$bot"; then
      check_fail "$bot has no Twitter references"
    else
      check_pass "$bot has no Twitter references"
    fi
  fi
done

echo ""
echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
echo "========================================="

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

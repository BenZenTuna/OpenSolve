#!/bin/bash
# Legal content verification for email storage compliance
# Run from project root: bash apps/web/tests/legal-content-check.sh

echo "========================================="
echo "LEGAL CONTENT VERIFICATION"
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

PRIVACY="apps/web/src/app/privacy/page.tsx"
TERMS="apps/web/src/app/terms/page.tsx"
IMPRESSUM="apps/web/src/app/impressum/page.tsx"
COOKIE="apps/web/src/components/CookieBanner.tsx"

# === PRIVACY POLICY ===

if grep -qi "email address" "$PRIVACY"; then
  check_pass "Privacy policy mentions email address"
else
  check_fail "Privacy policy mentions email address"
fi

if grep -qi "legitimate interest" "$PRIVACY"; then
  check_pass "Privacy policy states legitimate interest legal basis"
else
  check_fail "Privacy policy states legitimate interest legal basis"
fi

if grep -q "Article 6" "$PRIVACY"; then
  check_pass "Privacy policy references GDPR Art. 6"
else
  check_fail "Privacy policy references GDPR Art. 6"
fi

if grep -qi "right to erasure\|Art\. 17\|Article 17" "$PRIVACY"; then
  check_pass "Privacy policy mentions right to erasure"
else
  check_fail "Privacy policy mentions right to erasure"
fi

if grep -qi "right to object\|Art\. 21\|Article 21" "$PRIVACY"; then
  check_pass "Privacy policy mentions right to object"
else
  check_fail "Privacy policy mentions right to object"
fi

if grep -qi "data portability\|Art\. 20\|Article 20" "$PRIVACY"; then
  check_pass "Privacy policy mentions data portability"
else
  check_fail "Privacy policy mentions data portability"
fi

if grep -qi "marketing\|promotional" "$PRIVACY"; then
  check_pass "Privacy policy states no marketing emails"
else
  check_fail "Privacy policy states no marketing emails"
fi

if grep -qi "irrecoverably\|permanently.*delet" "$PRIVACY"; then
  check_pass "Privacy policy states deletion removes email"
else
  check_fail "Privacy policy states deletion removes email"
fi

if grep -qi "provided by google\|google.*authentication\|google.*oauth" "$PRIVACY"; then
  check_pass "Privacy policy identifies Google as email source"
else
  check_fail "Privacy policy identifies Google as email source"
fi

if grep -qi "twitter" "$PRIVACY"; then
  check_fail "Privacy policy has no Twitter references"
else
  check_pass "Privacy policy has no Twitter references"
fi

if grep -qi "IMY\|Integritetsskyddsmyndigheten\|Landesdatenschutz\|supervisory authority\|data protection authority" "$PRIVACY"; then
  check_pass "Privacy policy mentions supervisory authority"
else
  check_fail "Privacy policy mentions supervisory authority"
fi

# === TERMS OF SERVICE ===

if grep -qi "google account\|google.*sign\|verified email" "$TERMS"; then
  check_pass "Terms require Google account"
else
  check_fail "Terms require Google account"
fi

if grep -qi "service notification\|service communication\|important.*notification" "$TERMS"; then
  check_pass "Terms mention service communications"
else
  check_fail "Terms mention service communications"
fi

if grep -qi "twitter" "$TERMS"; then
  check_fail "Terms have no Twitter references"
else
  check_pass "Terms have no Twitter references"
fi

# === IMPRESSUM ===

if grep -qi "twitter" "$IMPRESSUM"; then
  check_fail "Impressum has no Twitter references"
else
  check_pass "Impressum has no Twitter references"
fi

# === COOKIE BANNER ===

if grep -qi "twitter" "$COOKIE"; then
  check_fail "Cookie banner has no Twitter references"
else
  check_pass "Cookie banner has no Twitter references"
fi

if grep -q "/privacy" "$COOKIE"; then
  check_pass "Cookie banner links to privacy policy"
else
  check_fail "Cookie banner links to privacy policy"
fi

echo ""
echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
echo "========================================="

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

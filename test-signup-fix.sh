#!/bin/bash

# Test signup flow after fixing database schema issue

BASE_URL="https://kickoff-o3hnrh41k-erwan-henrys-projects.vercel.app"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-signup-${TIMESTAMP}@example.com"

echo "Testing signup flow..."
echo "Email: $TEST_EMAIL"
echo ""

# Test signup
echo "1. Testing signup endpoint..."
SIGNUP_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"test1234\",\"name\":\"Test User\"}")

echo "Response: $SIGNUP_RESPONSE"
echo ""

# Check if signup was successful
if echo "$SIGNUP_RESPONSE" | grep -q "user"; then
  echo "✓ Signup successful!"
else
  echo "✗ Signup failed"
  echo "Full response:"
  echo "$SIGNUP_RESPONSE" | jq . 2>/dev/null || echo "$SIGNUP_RESPONSE"
  exit 1
fi

echo ""
echo "2. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/sign-in/email" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"test1234\"}")

echo "Response: $LOGIN_RESPONSE"
echo ""

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "token\|session"; then
  echo "✓ Login successful!"
else
  echo "✗ Login failed"
  echo "Full response:"
  echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
fi

echo ""
echo "Test complete!"

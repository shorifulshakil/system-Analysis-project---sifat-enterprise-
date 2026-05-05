#!/bin/bash

echo "=== Testing Backend API ==="

# Test auth endpoint
echo "1. Testing sign-in..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sifat.com","password":"admin123"}')

echo "Auth Response: $AUTH_RESPONSE"

# Extract token
TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.session.access_token // empty')

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not get token"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

# Test products endpoint
echo ""
echo "2. Testing products endpoint..."
curl -s -X GET http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "3. Testing sales endpoint..."
curl -s -X GET http://localhost:3001/api/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' | head -30

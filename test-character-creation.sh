#!/bin/bash

BASE_URL="http://localhost:3002"
echo "🧪 Testing Character Creation System E2E Flow"
echo "============================================="

# Test 1: Character API without auth should return 401
echo ""
echo "📋 Test 1: Character API without authentication"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/character" -w "\nHTTP_STATUS:%{http_code}")
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1 | cut -d: -f2)
if [ "$HTTP_STATUS" = "401" ]; then
    echo "✅ PASS: Unauthorized access properly rejected"
else
    echo "❌ FAIL: Expected 401, got $HTTP_STATUS"
fi

# Test 2: Create family and get token for further testing
echo ""
echo "📋 Test 2: Create test family and user"
CREATE_FAMILY_DATA='{
    "name": "TestFamily",
    "email": "test@example.com",
    "password": "testpass123",
    "userName": "TestUser"
}'

FAMILY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/create-family" \
    -H "Content-Type: application/json" \
    -d "$CREATE_FAMILY_DATA" \
    -w "\nHTTP_STATUS:%{http_code}")

FAMILY_HTTP_STATUS=$(echo "$FAMILY_RESPONSE" | tail -n1 | cut -d: -f2)
if [ "$FAMILY_HTTP_STATUS" = "200" ]; then
    echo "✅ PASS: Family creation successful"
    TOKEN=$(echo "$FAMILY_RESPONSE" | head -n -1 | jq -r '.token // empty')
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "✅ PASS: Authentication token received"
    else
        echo "❌ FAIL: No authentication token in response"
        exit 1
    fi
else
    echo "❌ FAIL: Family creation failed with status $FAMILY_HTTP_STATUS"
    echo "Response: $(echo "$FAMILY_RESPONSE" | head -n -1)"
    # Try with different email in case family already exists
    echo "   Trying login instead..."
    LOGIN_DATA='{"email": "test@example.com", "password": "testpass123"}'
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "$LOGIN_DATA" \
        -w "\nHTTP_STATUS:%{http_code}")

    LOGIN_HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1 | cut -d: -f2)
    if [ "$LOGIN_HTTP_STATUS" = "200" ]; then
        echo "✅ PASS: Login successful"
        TOKEN=$(echo "$LOGIN_RESPONSE" | head -n -1 | jq -r '.token // empty')
    else
        echo "❌ FAIL: Both family creation and login failed"
        exit 1
    fi
fi

# Test 3: Check character with valid token (should be null for new user)
echo ""
echo "📋 Test 3: Check character data for new user"
CHAR_RESPONSE=$(curl -s -X GET "$BASE_URL/api/character" \
    -H "Authorization: Bearer $TOKEN" \
    -w "\nHTTP_STATUS:%{http_code}")

CHAR_HTTP_STATUS=$(echo "$CHAR_RESPONSE" | tail -n1 | cut -d: -f2)
if [ "$CHAR_HTTP_STATUS" = "200" ]; then
    echo "✅ PASS: Character API accessible with valid token"
    CHARACTER=$(echo "$CHAR_RESPONSE" | head -n -1 | jq -r '.character // empty')
    if [ "$CHARACTER" = "null" ] || [ -z "$CHARACTER" ]; then
        echo "✅ PASS: New user has no character (as expected)"
    else
        echo "⚠️  INFO: User already has character, will test update flow"
    fi
else
    echo "❌ FAIL: Character API failed with status $CHAR_HTTP_STATUS"
    exit 1
fi

# Test 4: Create character
echo ""
echo "📋 Test 4: Create character"
CREATE_CHAR_DATA='{
    "name": "TestHero",
    "characterClass": "KNIGHT"
}'

CREATE_CHAR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/character/create" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_CHAR_DATA" \
    -w "\nHTTP_STATUS:%{http_code}")

CREATE_CHAR_HTTP_STATUS=$(echo "$CREATE_CHAR_RESPONSE" | tail -n1 | cut -d: -f2)
if [ "$CREATE_CHAR_HTTP_STATUS" = "200" ]; then
    echo "✅ PASS: Character creation successful"
    CHARACTER_ID=$(echo "$CREATE_CHAR_RESPONSE" | head -n -1 | jq -r '.character.id // empty')
    CHARACTER_NAME=$(echo "$CREATE_CHAR_RESPONSE" | head -n -1 | jq -r '.character.name // empty')
    CHARACTER_CLASS=$(echo "$CREATE_CHAR_RESPONSE" | head -n -1 | jq -r '.character.class // empty')

    if [ "$CHARACTER_NAME" = "TestHero" ] && [ "$CHARACTER_CLASS" = "KNIGHT" ]; then
        echo "✅ PASS: Character data matches input"
    else
        echo "❌ FAIL: Character data mismatch"
    fi
elif [ "$CREATE_CHAR_HTTP_STATUS" = "400" ]; then
    echo "⚠️  INFO: Character already exists (expected if running test multiple times)"
else
    echo "❌ FAIL: Character creation failed with status $CREATE_CHAR_HTTP_STATUS"
    echo "Response: $(echo "$CREATE_CHAR_RESPONSE" | head -n -1)"
fi

# Test 5: Verify character data after creation
echo ""
echo "📋 Test 5: Verify character data retrieval"
VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/character" \
    -H "Authorization: Bearer $TOKEN" \
    -w "\nHTTP_STATUS:%{http_code}")

VERIFY_HTTP_STATUS=$(echo "$VERIFY_RESPONSE" | tail -n1 | cut -d: -f2)
if [ "$VERIFY_HTTP_STATUS" = "200" ]; then
    echo "✅ PASS: Character retrieval successful"
    RETRIEVED_CHARACTER=$(echo "$VERIFY_RESPONSE" | head -n -1 | jq -r '.character // empty')
    if [ "$RETRIEVED_CHARACTER" != "null" ] && [ -n "$RETRIEVED_CHARACTER" ]; then
        echo "✅ PASS: Character data exists"
        RETRIEVED_NAME=$(echo "$VERIFY_RESPONSE" | head -n -1 | jq -r '.character.name // empty')
        RETRIEVED_CLASS=$(echo "$VERIFY_RESPONSE" | head -n -1 | jq -r '.character.class // empty')
        RETRIEVED_LEVEL=$(echo "$VERIFY_RESPONSE" | head -n -1 | jq -r '.character.level // empty')
        RETRIEVED_XP=$(echo "$VERIFY_RESPONSE" | head -n -1 | jq -r '.character.xp // empty')

        echo "📊 Character Stats:"
        echo "   Name: $RETRIEVED_NAME"
        echo "   Class: $RETRIEVED_CLASS"
        echo "   Level: $RETRIEVED_LEVEL"
        echo "   XP: $RETRIEVED_XP"

        if [ "$RETRIEVED_LEVEL" = "1" ] && [ "$RETRIEVED_XP" = "0" ]; then
            echo "✅ PASS: New character has correct initial stats"
        else
            echo "⚠️  INFO: Character has non-default stats (may be existing character)"
        fi
    else
        echo "❌ FAIL: No character data retrieved"
    fi
else
    echo "❌ FAIL: Character retrieval failed with status $VERIFY_HTTP_STATUS"
fi

# Test 6: Test invalid character class
echo ""
echo "📋 Test 6: Test invalid character class"
INVALID_CHAR_DATA='{
    "name": "InvalidHero",
    "characterClass": "INVALID_CLASS"
}'

INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/character/create" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$INVALID_CHAR_DATA" \
    -w "\nHTTP_STATUS:%{http_code}")

INVALID_HTTP_STATUS=$(echo "$INVALID_RESPONSE" | tail -n1 | cut -d: -f2)
if [ "$INVALID_HTTP_STATUS" = "400" ]; then
    echo "✅ PASS: Invalid character class properly rejected"
else
    echo "❌ FAIL: Invalid character class should be rejected with 400, got $INVALID_HTTP_STATUS"
fi

# Test 7: Test missing character name
echo ""
echo "📋 Test 7: Test missing character name"
NO_NAME_DATA='{
    "characterClass": "MAGE"
}'

NO_NAME_RESPONSE=$(curl -s -X POST "$BASE_URL/api/character/create" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$NO_NAME_DATA" \
    -w "\nHTTP_STATUS:%{http_code}")

NO_NAME_HTTP_STATUS=$(echo "$NO_NAME_RESPONSE" | tail -n1 | cut -d: -f2)
if [ "$NO_NAME_HTTP_STATUS" = "400" ]; then
    echo "✅ PASS: Missing character name properly rejected"
else
    echo "❌ FAIL: Missing character name should be rejected with 400, got $NO_NAME_HTTP_STATUS"
fi

echo ""
echo "🎉 Character Creation E2E Testing Complete!"
echo "============================================="
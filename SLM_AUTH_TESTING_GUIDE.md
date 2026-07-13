# MenstLLaMA API Key Authentication - Testing Guide

## 🎯 Test Scenarios

### Scenario 1: Unauthenticated Request (Should Fail ❌)

**Test:** Send request without X-API-Key header

```bash
curl -X POST http://your-ec2-ip:8080/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are PCOS symptoms?",
    "userContext": "User is 28 years old"
  }'
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "X-API-Key header is required"
}
```

**Expected Status:** `401 Unauthorized`

**Verification:**
- ✅ Response contains "Unauthorized" error
- ✅ HTTP status is 401
- ✅ No model inference occurs
- ✅ Server logs show auth failure

---

### Scenario 2: Invalid API Key (Should Fail ❌)

**Test:** Send request with wrong API key

```bash
curl -X POST http://your-ec2-ip:8080/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid_key_12345" \
  -d '{
    "message": "What are PCOS symptoms?",
    "userContext": "User is 28 years old"
  }'
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

**Expected Status:** `401 Unauthorized`

**Verification:**
- ✅ Response contains "Invalid API key" message
- ✅ HTTP status is 401
- ✅ No model inference occurs
- ✅ Server logs show invalid key attempt

---

### Scenario 3: Valid API Key (Should Succeed ✅)

**Test:** Send request with correct API key

```bash
curl -X POST http://your-ec2-ip:8080/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_ACTUAL_API_KEY_HERE" \
  -d '{
    "message": "What are common PCOS symptoms?",
    "userContext": "User is 28 years old"
  }'
```

**Expected Response:**
```json
{
  "response": "PCOS (Polycystic Ovary Syndrome) commonly presents with...",
  "model": "MenstLLaMA-EC2",
  "latency_ms": 1234
}
```

**Expected Status:** `200 OK`

**Verification:**
- ✅ Response contains AI-generated text
- ✅ HTTP status is 200
- ✅ Model inference completed
- ✅ Latency is reasonable (<30 seconds)
- ✅ Server logs show successful request

---

### Scenario 4: Health Check (No Auth Required ✅)

**Test:** Check server health without authentication

```bash
curl http://your-ec2-ip:8080/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "model": "MenstLLaMA-EC2"
}
```

**Expected Status:** `200 OK`

**Verification:**
- ✅ No authentication required
- ✅ Returns status ok
- ✅ Indicates model is loaded

---

### Scenario 5: Next.js Integration (Should Succeed ✅)

**Setup:**
1. Ensure `SLM_API_KEY` is set in `.env.local`
2. Ensure `MENSTLLAMA_EC2_URL` points to your EC2 instance
3. Restart Next.js dev server

**Test:** Send menstrual health question via chat UI

**Steps:**
1. Navigate to `/chat` in browser
2. Send message: "What helps with menstrual cramps?"
3. Wait for response

**Expected Behavior:**
- ✅ Message is sent successfully
- ✅ Response received from SLM
- ✅ "Powered by MenstLLaMA" badge appears
- ✅ No errors in browser console
- ✅ No errors in server logs

**Server Logs Should Show:**
```
GET /api/chat
  → Routing to SLM (keyword match)
  → SLM request with X-API-Key header
  → Response received
```

**Should NOT Show:**
```
❌ SLM authentication failed - check SLM_API_KEY
❌ SLM call failed, falling back to Bedrock
❌ HTTP 401
```

---

### Scenario 6: Fallback on Auth Failure (Should Work ✅)

**Setup:**
1. Set invalid `SLM_API_KEY` in `.env.local`
2. Restart Next.js

**Test:** Send menstrual health question

**Expected Behavior:**
- ✅ SLM request fails (401)
- ✅ Automatic fallback to Bedrock
- ✅ User still receives response
- ✅ No "MenstLLaMA" badge (Bedrock used)
- ✅ Server logs show fallback

**Server Logs Should Show:**
```
SLM authentication failed - check SLM_API_KEY environment variable
SLM call failed, falling back to Bedrock
```

---

## 🔬 Detailed Test Cases

### Test Case 1: Missing X-API-Key Header

```bash
# Request
POST /chat HTTP/1.1
Host: your-ec2-ip:8080
Content-Type: application/json

{
  "message": "test"
}

# Response
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "X-API-Key header is required"
}
```

**Pass Criteria:**
- Status code is 401
- Response contains "X-API-Key header is required"
- No inference occurs

---

### Test Case 2: Empty X-API-Key Header

```bash
# Request
POST /chat HTTP/1.1
Host: your-ec2-ip:8080
Content-Type: application/json
X-API-Key: 

{
  "message": "test"
}

# Response
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "X-API-Key header is required"
}
```

**Pass Criteria:**
- Treats empty string as missing
- Returns 401
- No inference occurs

---

### Test Case 3: Malformed API Key

```bash
# Request with special characters
curl -X POST http://your-ec2-ip:8080/chat \
  -H "X-API-Key: !@#$%^&*()" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Expected: 401 Invalid API key
```

**Pass Criteria:**
- Invalid characters don't cause server error
- Returns clean 401 response
- Server remains stable

---

### Test Case 4: Case Sensitivity

```bash
# Test with lowercase header
curl -X POST http://your-ec2-ip:8080/chat \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Expected: Should work (Flask is case-insensitive for headers)
```

**Pass Criteria:**
- Lowercase header works
- Uppercase header works
- Mixed case works

---

### Test Case 5: Multiple Requests

```bash
# Send 5 requests in sequence
for i in {1..5}; do
  curl -X POST http://your-ec2-ip:8080/chat \
    -H "X-API-Key: YOUR_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"test $i\"}"
  echo ""
done
```

**Pass Criteria:**
- All requests succeed
- No rate limiting issues
- Consistent response times
- No memory leaks

---

## 📊 Integration Tests

### Integration Test 1: End-to-End Flow

**Scenario:** User sends menstrual health question via chat

**Steps:**
1. User types: "Why do I get mood swings before my period?"
2. Next.js receives request at `/api/chat`
3. Chat route calls `routeToSLM()` → returns `true`
4. Chat route calls `chatWithSLM()`
5. Client adds `X-API-Key` header
6. Flask receives request, validates key
7. Flask runs inference
8. Response flows back to user

**Verification Points:**
- ✅ Message routes to SLM (keyword match)
- ✅ API key sent in request
- ✅ Flask validates successfully
- ✅ Inference completes
- ✅ Response returns to user
- ✅ MenstLLaMA badge shown

---

### Integration Test 2: Auth Failure Recovery

**Scenario:** API key is wrong, system falls back

**Steps:**
1. Configure wrong API key
2. Send menstrual health question
3. SLM returns 401
4. Client catches error
5. Falls back to Bedrock
6. User receives response

**Verification Points:**
- ✅ 401 detected and logged
- ✅ Fallback triggered automatically
- ✅ Bedrock responds
- ✅ User experience not broken
- ✅ No MenstLLaMA badge shown

---

### Integration Test 3: Health Check Monitoring

**Scenario:** System checks SLM availability

**Steps:**
1. `checkSLMHealth()` called
2. Requests `/health` endpoint
3. Caches result for 60 seconds
4. Subsequent calls use cache

**Verification Points:**
- ✅ Health check succeeds
- ✅ Result cached
- ✅ No repeated health checks within 60s
- ✅ Cache expires after 60s

---

## 🛠️ Automated Test Script

### test-slm-auth.sh

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EC2_URL="${1:-http://localhost:8080}"
API_KEY="${2}"

if [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: API key required${NC}"
    echo "Usage: ./test-slm-auth.sh <EC2_URL> <API_KEY>"
    exit 1
fi

echo "Testing MenstLLaMA API Key Authentication"
echo "EC2 URL: $EC2_URL"
echo ""

# Test 1: No API Key
echo -e "${YELLOW}Test 1: Request without API key (should fail)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$EC2_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASS: Returned 401${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $HTTP_CODE${NC}"
fi
echo ""

# Test 2: Invalid API Key
echo -e "${YELLOW}Test 2: Request with invalid API key (should fail)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$EC2_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid_key" \
  -d '{"message": "test"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASS: Returned 401${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $HTTP_CODE${NC}"
fi
echo ""

# Test 3: Valid API Key
echo -e "${YELLOW}Test 3: Request with valid API key (should succeed)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$EC2_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"message": "What are PCOS symptoms?"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS: Returned 200${NC}"
    if echo "$BODY" | grep -q "response"; then
        echo -e "${GREEN}✓ PASS: Response contains inference result${NC}"
    else
        echo -e "${RED}✗ FAIL: Response missing inference result${NC}"
    fi
else
    echo -e "${RED}✗ FAIL: Expected 200, got $HTTP_CODE${NC}"
fi
echo ""

# Test 4: Health Check
echo -e "${YELLOW}Test 4: Health check (no auth required)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$EC2_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS: Health check succeeded${NC}"
else
    echo -e "${RED}✗ FAIL: Health check failed with $HTTP_CODE${NC}"
fi
echo ""

echo "Testing complete!"
```

### Usage:
```bash
chmod +x test-slm-auth.sh
./test-slm-auth.sh http://your-ec2-ip:8080 your_api_key
```

---

## 🔍 Debugging Guide

### Debug 1: Check API Key on Server

```bash
# SSH to EC2
ssh ubuntu@your-ec2-ip

# View API key file
cat /etc/menstllama/api_key

# Check permissions
ls -la /etc/menstllama/api_key
# Should be: -rw------- 1 ubuntu ubuntu

# Check Flask logs
sudo journalctl -u ovira-slm.service -n 50

# Should see:
# "✓ API key loaded from /etc/menstllama/api_key"
# "✓ API key authentication enabled"
```

---

### Debug 2: Check Next.js Environment

```bash
# In Next.js project directory

# Check if variable is set
echo $SLM_API_KEY

# View .env.local (be careful not to share!)
grep SLM_API_KEY .env.local

# Check Next.js server logs
# Look for: "SLM authentication failed" or "401"
```

---

### Debug 3: Test with Verbose Curl

```bash
# Verbose request to see all headers
curl -v -X POST http://your-ec2-ip:8080/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_key" \
  -d '{"message": "test"}'

# Check:
# - Request headers sent
# - Response status
# - Response headers
# - Response body
```

---

### Debug 4: Check Flask is Running

```bash
# SSH to EC2
ssh ubuntu@your-ec2-ip

# Check service status
sudo systemctl status ovira-slm.service

# Should show: "active (running)"

# Check if port is open
sudo netstat -tulpn | grep 8080

# Test locally on EC2
curl http://localhost:8080/health
```

---

## 📈 Performance Testing

### Load Test: Multiple Authenticated Requests

```bash
# Install apache bench (ab)
sudo apt-get install apache2-utils

# Run 100 requests, 10 concurrent
ab -n 100 -c 10 \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -p request.json \
  http://your-ec2-ip:8080/chat

# request.json:
{
  "message": "test",
  "userContext": ""
}
```

**Expected Results:**
- All requests succeed (200 OK)
- Consistent response times
- No auth failures
- No server crashes

---

## ✅ Acceptance Checklist

### Before Deployment
- [ ] API key generated (64 chars hex)
- [ ] API key stored at `/etc/menstllama/api_key`
- [ ] File permissions set to 600
- [ ] Flask server updated with auth decorator
- [ ] Next.js client updated with API key header
- [ ] `.env.example` updated
- [ ] Documentation complete

### After Deployment
- [ ] Test 1: Unauthenticated request returns 401
- [ ] Test 2: Invalid API key returns 401
- [ ] Test 3: Valid API key returns 200 with response
- [ ] Test 4: Health check works without auth
- [ ] Test 5: Next.js chat integration works
- [ ] Test 6: Fallback to Bedrock on auth failure works
- [ ] Server logs show "API key authentication enabled"
- [ ] No API key visible in public logs

### Security Verification
- [ ] API key not in Git repository
- [ ] API key not in `.env.example` (template only)
- [ ] API key file has correct permissions (600)
- [ ] API key not logged in server output
- [ ] HTTPS recommended for production
- [ ] Different keys for dev/staging/prod

---

## 🎉 Success Criteria

All tests pass when:
- ✅ Unauthenticated requests return 401
- ✅ Invalid API keys return 401
- ✅ Valid API keys return 200 with inference
- ✅ Next.js successfully authenticates
- ✅ Fallback works on auth failures
- ✅ Health checks work without auth
- ✅ No security information leaks
- ✅ Server remains stable under load

**Status**: Ready for Production Testing! 🚀

---

**Last Updated**: 2026-05-29  
**Version**: 1.0.0

# MenstLLaMA API Key Authentication - Deployment Checklist

## ✅ Pre-Deployment Checklist

### Code Changes
- [x] Updated `deploy-menstllama-ec2.sh` to generate API key
- [x] Added API key storage at `/etc/menstllama/api_key`
- [x] Added authentication decorator to Flask server
- [x] Updated `menstllama-client.ts` to send API key
- [x] Updated `.env.example` with `SLM_API_KEY`
- [x] Updated `ENV_VARIABLES_REFERENCE.md`
- [x] All files compile without errors
- [x] TypeScript diagnostics pass

### Documentation
- [x] Created `SLM_API_KEY_AUTH.md` (implementation guide)
- [x] Created `SLM_AUTH_TESTING_GUIDE.md` (testing guide)
- [x] Created `SLM_AUTH_SUMMARY.md` (executive summary)
- [x] Created `SLM_AUTH_CHECKLIST.md` (this file)
- [x] Updated environment variable documentation

---

## 🚀 Deployment Steps

### On EC2 Instance

#### Step 1: Run Deployment Script
```bash
- [ ] SSH to EC2 instance
- [ ] Upload deployment script
- [ ] Make executable: chmod +x deploy-menstllama-ec2.sh
- [ ] Run: ./deploy-menstllama-ec2.sh
- [ ] Wait for completion (15-20 minutes)
```

#### Step 2: Verify API Key Generation
```bash
- [ ] Check file exists: ls -la /etc/menstllama/api_key
- [ ] Verify permissions: -rw------- (600)
- [ ] Verify owner: ubuntu:ubuntu
- [ ] Copy API key from deployment output
```

#### Step 3: Verify Flask Server
```bash
- [ ] Check service status: sudo systemctl status ovira-slm
- [ ] Should show: "active (running)"
- [ ] Check logs: sudo journalctl -u ovira-slm -n 20
- [ ] Should see: "✓ API key loaded"
- [ ] Should see: "✓ API key authentication enabled"
```

#### Step 4: Test Locally on EC2
```bash
- [ ] Test health: curl http://localhost:8080/health
- [ ] Should return: {"status": "ok", ...}
- [ ] Test without auth: curl -X POST http://localhost:8080/chat -d '{}'
- [ ] Should return: 401 Unauthorized
- [ ] Test with auth: curl -H "X-API-Key: YOUR_KEY" ...
- [ ] Should return: 200 with response
```

### On Next.js Application

#### Step 5: Update Environment
```bash
- [ ] Open .env.local file
- [ ] Add: MENSTLLAMA_EC2_URL=http://[EC2_IP]:8080
- [ ] Add: SLM_API_KEY=[API_KEY_FROM_EC2]
- [ ] Save file
- [ ] Verify no trailing spaces/newlines
```

#### Step 6: Restart Next.js
```bash
- [ ] Stop dev server (Ctrl+C)
- [ ] Clear cache: rm -rf .next
- [ ] Start dev server: npm run dev
- [ ] Wait for compilation
- [ ] Check no error messages
```

#### Step 7: Verify Environment
```bash
- [ ] Check SLM_API_KEY is set: echo $SLM_API_KEY
- [ ] Should show your API key
- [ ] Check MENSTLLAMA_EC2_URL: echo $MENSTLLAMA_EC2_URL
- [ ] Should show EC2 URL
```

---

## 🧪 Testing Checklist

### Manual API Tests

#### Test 1: No Authentication
```bash
- [ ] Run: curl -X POST http://[EC2_IP]:8080/chat \
         -H "Content-Type: application/json" \
         -d '{"message":"test"}'
- [ ] Expected: 401 Unauthorized
- [ ] Expected message: "X-API-Key header is required"
- [ ] Actual result: _____________
```

#### Test 2: Invalid API Key
```bash
- [ ] Run: curl -X POST http://[EC2_IP]:8080/chat \
         -H "X-API-Key: wrong_key" \
         -H "Content-Type: application/json" \
         -d '{"message":"test"}'
- [ ] Expected: 401 Unauthorized
- [ ] Expected message: "Invalid API key"
- [ ] Actual result: _____________
```

#### Test 3: Valid API Key
```bash
- [ ] Run: curl -X POST http://[EC2_IP]:8080/chat \
         -H "X-API-Key: [YOUR_KEY]" \
         -H "Content-Type: application/json" \
         -d '{"message":"What are PCOS symptoms?"}'
- [ ] Expected: 200 OK
- [ ] Expected: JSON with "response", "model", "latency_ms"
- [ ] Actual result: _____________
```

#### Test 4: Health Check
```bash
- [ ] Run: curl http://[EC2_IP]:8080/health
- [ ] Expected: 200 OK
- [ ] Expected: {"status": "ok", "model": "MenstLLaMA-EC2"}
- [ ] No authentication required
- [ ] Actual result: _____________
```

### UI Integration Tests

#### Test 5: Chat UI (Menstrual Health Question)
```bash
- [ ] Navigate to: http://localhost:3000/chat
- [ ] Type: "What helps with menstrual cramps?"
- [ ] Send message
- [ ] Expected: Response received within 30 seconds
- [ ] Expected: "Powered by MenstLLaMA" badge appears
- [ ] Expected: No errors in browser console
- [ ] Expected: No errors in server logs
- [ ] Actual result: _____________
```

#### Test 6: Chat UI (General Question - Bedrock)
```bash
- [ ] Type: "What is the weather like?"
- [ ] Send message
- [ ] Expected: Response from Bedrock (no SLM badge)
- [ ] Expected: No authentication errors
- [ ] Actual result: _____________
```

#### Test 7: Auth Failure Fallback
```bash
- [ ] Temporarily set wrong SLM_API_KEY in .env.local
- [ ] Restart Next.js
- [ ] Send menstrual health question
- [ ] Expected: Response still received (from Bedrock)
- [ ] Expected: No MenstLLaMA badge
- [ ] Expected: Server logs show "SLM authentication failed"
- [ ] Expected: Automatic fallback to Bedrock
- [ ] Restore correct API key
- [ ] Restart Next.js
- [ ] Actual result: _____________
```

---

## 🔍 Verification Checklist

### Server-Side Verification

```bash
- [ ] SSH to EC2: ssh ubuntu@[EC2_IP]
- [ ] Check API key file:
    - [ ] cat /etc/menstllama/api_key
    - [ ] Key is 64 characters (hex)
- [ ] Check file permissions:
    - [ ] ls -la /etc/menstllama/api_key
    - [ ] Shows: -rw------- 1 ubuntu ubuntu
- [ ] Check Flask service:
    - [ ] sudo systemctl status ovira-slm
    - [ ] Shows: active (running)
- [ ] Check Flask logs:
    - [ ] sudo journalctl -u ovira-slm -n 50
    - [ ] Shows: "✓ API key loaded"
    - [ ] Shows: "✓ API key authentication enabled"
    - [ ] No error messages
```

### Client-Side Verification

```bash
- [ ] Check .env.local file:
    - [ ] Contains: MENSTLLAMA_EC2_URL
    - [ ] Contains: SLM_API_KEY
    - [ ] Values match EC2 deployment
- [ ] Check Next.js server logs:
    - [ ] No "SLM authentication failed" errors
    - [ ] No "401" errors when using SLM
- [ ] Check browser console:
    - [ ] No network errors
    - [ ] No 401 responses
```

---

## 🛡️ Security Verification

### Access Control
```bash
- [ ] Unauthenticated requests blocked (401)
- [ ] Invalid API keys rejected (401)
- [ ] Valid API keys accepted (200)
- [ ] Health endpoint accessible without auth
```

### Key Security
```bash
- [ ] API key NOT in Git repository
- [ ] API key NOT in .env.example (template only)
- [ ] API key file has 600 permissions
- [ ] API key file owned by ubuntu
- [ ] API key NOT in server logs
- [ ] API key NOT in client logs
```

### Data Protection
```bash
- [ ] API key stored securely on server
- [ ] API key loaded from file, not hardcoded
- [ ] Error messages don't leak key info
- [ ] 401 responses don't expose key format
```

---

## 📊 Performance Verification

### Latency Tests
```bash
- [ ] Request with auth: < 5 seconds for health check
- [ ] Request with auth: < 30 seconds for inference
- [ ] Auth overhead: < 1ms (negligible)
- [ ] No performance degradation vs before
```

### Load Tests (Optional)
```bash
- [ ] 10 concurrent requests: All succeed
- [ ] 100 total requests: All succeed
- [ ] No server crashes under load
- [ ] Consistent response times
```

---

## 📝 Documentation Verification

### Files Created
```bash
- [ ] SLM_API_KEY_AUTH.md exists
- [ ] SLM_AUTH_TESTING_GUIDE.md exists
- [ ] SLM_AUTH_SUMMARY.md exists
- [ ] SLM_AUTH_CHECKLIST.md exists
```

### Documentation Quality
```bash
- [ ] All examples are accurate
- [ ] All commands have been tested
- [ ] All curl commands work
- [ ] All troubleshooting steps verified
- [ ] All file paths correct
```

---

## 🚨 Rollback Plan

### If Issues Occur

#### Quick Rollback (Disable Auth)
```bash
- [ ] SSH to EC2
- [ ] Remove API key file: sudo rm /etc/menstllama/api_key
- [ ] Restart service: sudo systemctl restart ovira-slm
- [ ] Server now runs without authentication
- [ ] Remove SLM_API_KEY from .env.local
- [ ] Restart Next.js
```

#### Full Rollback (Previous Version)
```bash
- [ ] Revert deployment script changes
- [ ] Revert menstllama-client.ts changes
- [ ] Redeploy to EC2
- [ ] Remove SLM_API_KEY from .env.local
- [ ] Restart Next.js
```

---

## ✅ Final Sign-Off

### Pre-Production
```bash
- [ ] All tests pass
- [ ] All verifications complete
- [ ] Documentation reviewed
- [ ] Security checked
- [ ] Performance acceptable
```

### Production Readiness
```bash
- [ ] Different API key for production
- [ ] HTTPS configured (load balancer)
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Backup plan tested
```

### Team Communication
```bash
- [ ] Team notified of changes
- [ ] API key shared securely (not email/Slack)
- [ ] Documentation shared
- [ ] Support trained on troubleshooting
```

---

## 📞 Support Information

### If Tests Fail

**Check these first:**
1. API key matches on server and client
2. Environment variables set correctly
3. Next.js restarted after env changes
4. Flask service is running
5. EC2 security group allows port 8080

**Common Issues:**
- Wrong API key → Check .env.local vs /etc/menstllama/api_key
- 401 errors → Verify SLM_API_KEY is set and correct
- Always fallback → Check authentication in logs

**Documentation:**
- See `SLM_API_KEY_AUTH.md` for detailed guide
- See `SLM_AUTH_TESTING_GUIDE.md` for testing help
- See `SLM_AUTH_SUMMARY.md` for quick reference

---

## 🎉 Completion

### When All Checks Pass

```
✅ API Key Authentication Deployed Successfully!

- Endpoint secured with API key
- All tests passing
- Documentation complete
- Team notified
- Ready for production

Deployment Date: _____________
Deployed By: _____________
API Key Securely Stored: ✅
All Tests Pass: ✅
```

---

**Last Updated**: 2026-05-29  
**Version**: 1.0.0  
**Status**: Ready for Deployment

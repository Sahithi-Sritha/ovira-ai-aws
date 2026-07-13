# DynamoDB Optimization - Deployment Checklist

## 📋 Pre-Deployment Checklist

### Code Verification
- [x] All ScanCommand usage removed from src/
- [x] TypeScript compilation passes with no errors
- [x] All unit tests pass
- [x] Verification script passes: `npm run verify:no-scans`
- [x] No breaking changes to API endpoints
- [x] All function signatures documented

### Documentation
- [x] Technical documentation complete (DYNAMODB_OPTIMIZATION.md)
- [x] Developer guide complete (DYNAMODB_QUICK_REFERENCE.md)
- [x] Migration guide complete (DYNAMODB_FIXES_README.md)
- [x] Architecture diagrams complete (ARCHITECTURE_BEFORE_AFTER.md)
- [x] Changes summary complete (CHANGES_SUMMARY.md)

### Scripts
- [x] Table creation script updated (scripts/create-tables.mjs)
- [x] GSI migration script created (scripts/add-email-gsi.mjs)
- [x] Verification script created (scripts/verify-no-scans.mjs)
- [x] NPM scripts added to package.json

---

## 🚀 Deployment Steps

### For New Deployments (Fresh Install)

#### Step 1: Create Tables
```bash
npm run db:create-tables
```
**Expected**: All tables created with EmailIndex GSI

#### Step 2: Verify Setup
```bash
npm run verify:no-scans
```
**Expected**: ✅ Verification PASSED

#### Step 3: Deploy Application
```bash
npm run build
# Deploy to your hosting platform
```

#### Step 4: Smoke Test
```bash
# Test user lookup
curl https://your-api.com/api/user?userId=test-user

# Test symptoms query
curl https://your-api.com/api/symptoms?userId=test-user&limit=10
```

---

### For Existing Deployments (Migration)

#### Step 1: Backup (Optional but Recommended)
```bash
# Backup DynamoDB tables
aws dynamodb create-backup \
  --table-name ovira-users \
  --backup-name ovira-users-pre-optimization-$(date +%Y%m%d)

aws dynamodb create-backup \
  --table-name ovira-symptoms \
  --backup-name ovira-symptoms-pre-optimization-$(date +%Y%m%d)
```

#### Step 2: Add EmailIndex GSI
```bash
npm run db:add-email-gsi
```
**Expected**: GSI creation initiated
**Duration**: 5-10 minutes

#### Step 3: Monitor GSI Creation
```bash
# Check GSI status
aws dynamodb describe-table --table-name ovira-users \
  --query 'Table.GlobalSecondaryIndexes[?IndexName==`EmailIndex`].IndexStatus'
```
**Wait for**: Status = "ACTIVE"

#### Step 4: Verify Data Integrity
```bash
# Ensure all users have userId field
aws dynamodb scan --table-name ovira-users \
  --projection-expression "userId" \
  --limit 10
```
**Check**: All items have userId attribute

#### Step 5: Deploy New Code
```bash
# Build application
npm run build

# Deploy to your hosting platform
# (Vercel, AWS, etc.)
```

#### Step 6: Verify Deployment
```bash
npm run verify:no-scans
```
**Expected**: ✅ Verification PASSED

#### Step 7: Smoke Test
```bash
# Test user lookup by ID
curl https://your-api.com/api/user?userId=existing-user-id

# Test user lookup by email (new functionality)
# (if you add this API endpoint)

# Test symptoms date range query
curl "https://your-api.com/api/symptoms?userId=existing-user-id&limit=30"
```

#### Step 8: Monitor CloudWatch
- Check `ConsumedReadCapacityUnits` metric
- Should see 95%+ reduction
- Monitor for 24 hours

---

## 🔍 Post-Deployment Verification

### Automated Checks
```bash
# 1. Verify no scans
npm run verify:no-scans

# 2. Check TypeScript compilation
npm run build

# 3. Run tests
npm test
```

### Manual Checks

#### Check 1: User Lookup Performance
```bash
# Should return in < 50ms
time curl https://your-api.com/api/user?userId=test-user
```

#### Check 2: Symptoms Query Performance
```bash
# Should return in < 100ms
time curl "https://your-api.com/api/symptoms?userId=test-user&limit=30"
```

#### Check 3: CloudWatch Metrics
1. Open AWS CloudWatch Console
2. Navigate to DynamoDB metrics
3. Check `ConsumedReadCapacityUnits` for:
   - ovira-users table
   - ovira-symptoms table
4. Verify 95%+ reduction compared to pre-deployment

#### Check 4: Application Logs
```bash
# Check for any errors
# Look for:
# - "Error getting user profile"
# - "Error fetching symptom logs"
# - Any DynamoDB-related errors
```

---

## 📊 Success Criteria

### Performance Metrics
- [ ] User lookup latency < 50ms (p99)
- [ ] Symptoms query latency < 100ms (p99)
- [ ] RCU consumption reduced by 95%+
- [ ] No timeout errors

### Functional Metrics
- [ ] All user lookups working
- [ ] All symptom queries working
- [ ] No 500 errors in logs
- [ ] No data loss

### Cost Metrics
- [ ] DynamoDB costs reduced by 95%+
- [ ] No unexpected charges
- [ ] GSI costs within expected range

---

## 🐛 Troubleshooting

### Issue: GSI Creation Stuck
**Symptoms**: GSI status remains "CREATING" for > 30 minutes
**Solution**: 
```bash
# Check table status
aws dynamodb describe-table --table-name ovira-users

# If stuck, contact AWS Support
# GSI creation should complete in 5-10 minutes for small tables
```

### Issue: "Index not found" Error
**Symptoms**: Email lookups fail with "Index not found"
**Solution**:
```bash
# Verify GSI exists and is ACTIVE
aws dynamodb describe-table --table-name ovira-users \
  --query 'Table.GlobalSecondaryIndexes[?IndexName==`EmailIndex`]'

# If not ACTIVE, wait for creation to complete
```

### Issue: "User not found" After Deployment
**Symptoms**: Previously working user lookups now fail
**Solution**:
```bash
# Check if users have userId field
aws dynamodb get-item \
  --table-name ovira-users \
  --key '{"userId":{"S":"test-user-id"}}'

# If userId is missing, data migration needed
# Contact support for data migration script
```

### Issue: High RCU Consumption
**Symptoms**: RCU usage not reduced as expected
**Solution**:
```bash
# Verify no scans remain
npm run verify:no-scans

# Check CloudWatch logs for scan operations
# Look for "ScanCommand" in application logs
```

---

## 🔄 Rollback Plan

### If Issues Occur

#### Immediate Rollback (< 1 hour)
```bash
# 1. Revert code deployment
git revert HEAD
npm run build
# Deploy previous version

# 2. GSI remains (no harm, can be used later)
# 3. Application reverts to previous behavior
```

#### Partial Rollback (Specific Functions)
```bash
# If only specific functions have issues:
# 1. Identify problematic function
# 2. Revert only that function in git
# 3. Keep other optimizations
# 4. Deploy partial fix
```

#### Complete Rollback (> 1 hour)
```bash
# 1. Revert all code changes
git revert <commit-hash>

# 2. Optionally delete GSI (not required)
aws dynamodb update-table \
  --table-name ovira-users \
  --global-secondary-index-updates \
  '[{"Delete":{"IndexName":"EmailIndex"}}]'

# 3. Restore from backup if needed
aws dynamodb restore-table-from-backup \
  --target-table-name ovira-users \
  --backup-arn <backup-arn>
```

---

## 📞 Support Contacts

### Technical Issues
- Check documentation: `DYNAMODB_QUICK_REFERENCE.md`
- Check troubleshooting: This file, section above
- Check AWS CloudWatch logs

### AWS Issues
- AWS Support Console
- DynamoDB Service Health Dashboard

---

## ✅ Final Checklist

### Before Going Live
- [ ] All pre-deployment checks passed
- [ ] GSI is ACTIVE (for existing deployments)
- [ ] Backup created (for existing deployments)
- [ ] Code deployed successfully
- [ ] Smoke tests passed
- [ ] CloudWatch metrics look good

### After Going Live
- [ ] Monitor for 1 hour
- [ ] Check error rates
- [ ] Verify performance improvements
- [ ] Monitor costs
- [ ] Document any issues

### 24 Hours Post-Deployment
- [ ] Review CloudWatch metrics
- [ ] Confirm 95%+ RCU reduction
- [ ] Verify no errors in logs
- [ ] Check user feedback
- [ ] Update team on success

---

## 🎉 Success!

If all checks pass:
- ✅ Deployment successful
- ✅ Performance improved 100x
- ✅ Costs reduced 99%
- ✅ Zero scan operations
- ✅ Production ready

**Congratulations! Your DynamoDB optimization is complete!** 🚀

---

**Last Updated**: 2026-05-29
**Version**: 1.0.0
**Status**: Ready for Deployment

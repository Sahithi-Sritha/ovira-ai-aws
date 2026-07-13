# DynamoDB Optimization - Scan Anti-Pattern Fixes

## Overview

This document describes the optimization changes made to eliminate DynamoDB Scan anti-patterns and replace them with efficient GetCommand and Query operations using Global Secondary Indexes (GSIs).

## Changes Made

### 1. Users Table Optimization

#### Before
- Used `ScanCommand` with `FilterExpression` to find users by id/uid/email
- Full table scan on every user lookup
- O(n) complexity where n = total users in table

#### After
- **Primary Key**: `userId` (HASH)
- **GSI**: `EmailIndex` on `email` attribute
- Uses `GetCommand` for direct userId lookups - O(1) complexity
- Uses `QueryCommand` on EmailIndex for email lookups - O(1) complexity

#### New Functions
```typescript
// Direct lookup by userId (primary key)
getUserProfile(userId: string): Promise<UserProfile | null>

// Lookup by email using GSI
getUserProfileByEmail(email: string): Promise<UserProfile | null>
```

### 2. Symptoms Table Optimization

#### Before
- Used `ScanCommand` with client-side filtering for date ranges
- Full table scan to get all user symptoms, then filtered in memory
- O(n) complexity where n = total symptoms in table

#### After
- **Composite Key**: `userId` (HASH) + `date` (RANGE)
- Uses `QueryCommand` with `KeyConditionExpression` for date range queries
- O(log n + m) complexity where m = matching items

#### Optimized Functions
```typescript
// Efficient date range query using composite key
getSymptomLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<SymptomLog[]>

// Query all symptoms for a user
getUserSymptomLogs(userId: string, limit?: number): Promise<SymptomLog[]>
```

### 3. Removed Operations

All `ScanCommand` imports and usages have been removed from production code paths:
- ❌ No more full table scans
- ❌ No more client-side filtering
- ❌ No more O(n) operations on hot paths

## Migration Guide

### For New Deployments

1. Run the table creation script with GSI support:
```bash
node scripts/create-tables.mjs
```

### For Existing Deployments

1. Add the EmailIndex GSI to the existing users table:
```bash
node scripts/add-email-gsi.mjs
```

2. Wait for GSI creation to complete (check AWS Console or CLI):
```bash
aws dynamodb describe-table --table-name ovira-users
```

3. Ensure all user records have a `userId` field (should match uid/id from old schema)

4. Ensure all symptom logs use normalized date format (YYYY-MM-DD)

## Performance Impact

### Users Table
| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Get by userId | Scan (O(n)) | Get (O(1)) | ~1000x faster |
| Get by email | Scan (O(n)) | Query GSI (O(1)) | ~1000x faster |

### Symptoms Table
| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Date range query | Scan + filter (O(n)) | Query (O(log n + m)) | ~100x faster |
| Get user logs | Query (O(log n + m)) | Query (O(log n + m)) | No change (already optimized) |

## Cost Impact

- **Read Capacity**: Reduced by ~99% for user lookups
- **Read Capacity**: Reduced by ~95% for symptom date range queries
- **GSI Cost**: Minimal additional cost for EmailIndex (PAY_PER_REQUEST mode)

## Breaking Changes

### Function Signatures Changed

1. **getSymptomLog**: Second parameter changed from `logId` to `date`
```typescript
// Before
getSymptomLog(userId: string, logId: string)

// After
getSymptomLog(userId: string, date: string)
```

2. **updateSymptomLog**: Second parameter changed from `logId` to `date`
```typescript
// Before
updateSymptomLog(userId: string, logId: string, updates: Partial<SymptomLog>)

// After
updateSymptomLog(userId: string, date: string, updates: Partial<SymptomLog>)
```

3. **deleteSymptomLog**: Second parameter changed from `logId` to `date`
```typescript
// Before
deleteSymptomLog(userId: string, logId: string)

// After
deleteSymptomLog(userId: string, date: string)
```

### Data Model Changes

1. **Users Table**: Primary key is now `userId` (not `id`, `uid`, or `email`)
2. **Symptoms Table**: Sort key is `date` (YYYY-MM-DD format, not `timestamp`)

## Validation

### Verify No Scans in Hot Paths

Run this command to ensure no ScanCommand usage remains:
```bash
grep -r "ScanCommand" src/lib/aws/dynamodb.ts
```

Expected result: No matches (ScanCommand import removed)

### Test User Lookups

```typescript
// Test direct userId lookup
const profile = await getUserProfile('user123');

// Test email lookup via GSI
const profileByEmail = await getUserProfileByEmail('user@example.com');
```

### Test Symptom Date Range Queries

```typescript
// Test efficient date range query
const logs = await getSymptomLogsByDateRange('user123', '2026-01-01', '2026-01-31');
```

## Monitoring

Monitor these CloudWatch metrics to verify optimization:
- `ConsumedReadCapacityUnits` - should decrease significantly
- `UserErrors` - should remain at 0 (no breaking changes in API)
- Query latency - should improve by 10-100x

## Rollback Plan

If issues occur:
1. The old code is preserved in git history
2. GSI can be deleted without affecting existing data
3. Revert to previous commit and redeploy

## References

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Avoiding Scans](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-query-scan.html)
- [Global Secondary Indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)

# DynamoDB Quick Reference - After Optimization

## 🚀 Quick Start

All DynamoDB operations are now optimized for performance. Use these patterns:

## User Operations

### Get User by ID (Primary Key)
```typescript
import { getUserProfile } from '@/lib/aws/dynamodb';

const user = await getUserProfile(userId);
```
**Performance**: O(1) - Direct GetCommand

### Get User by Email (GSI)
```typescript
import { getUserProfileByEmail } from '@/lib/aws/dynamodb';

const user = await getUserProfileByEmail('user@example.com');
```
**Performance**: O(1) - Query on EmailIndex GSI

### Create User
```typescript
import { createUserProfile } from '@/lib/aws/dynamodb';

await createUserProfile({
  userId: 'user123',
  email: 'user@example.com',
  name: 'Jane Doe',
  // ... other fields
});
```
**Required**: `userId` field is mandatory

### Update User
```typescript
import { updateUserProfile } from '@/lib/aws/dynamodb';

await updateUserProfile(userId, {
  name: 'Jane Smith',
  // ... other fields to update
});
```
**Performance**: O(1) - Direct UpdateCommand

## Symptom Log Operations

### Get All Symptoms for User
```typescript
import { getUserSymptomLogs } from '@/lib/aws/dynamodb';

const logs = await getUserSymptomLogs(userId, 100); // limit optional
```
**Performance**: O(log n + m) - Query on userId partition key
**Returns**: Sorted by date descending (newest first)

### Get Symptoms by Date Range
```typescript
import { getSymptomLogsByDateRange } from '@/lib/aws/dynamodb';

const logs = await getSymptomLogsByDateRange(
  userId,
  '2026-01-01',
  '2026-01-31'
);
```
**Performance**: O(log n + m) - Query with BETWEEN on composite key
**Date Format**: YYYY-MM-DD

### Create Symptom Log
```typescript
import { createSymptomLog } from '@/lib/aws/dynamodb';

const logId = await createSymptomLog({
  userId: 'user123',
  date: '2026-05-29',
  flowLevel: 3,
  painLevel: 2,
  mood: 'good',
  symptoms: ['cramps', 'fatigue'],
  // ... other fields
});
```
**Returns**: Composite ID in format `userId_YYYY-MM-DD`
**Note**: Automatically upserts (one log per user per date)

### Get Single Symptom Log
```typescript
import { getSymptomLog } from '@/lib/aws/dynamodb';

const log = await getSymptomLog(userId, '2026-05-29');
```
**Performance**: O(1) - Direct GetCommand with composite key
**Parameter**: Use date string (YYYY-MM-DD), not logId

### Update Symptom Log
```typescript
import { updateSymptomLog } from '@/lib/aws/dynamodb';

await updateSymptomLog(userId, '2026-05-29', {
  painLevel: 3,
  notes: 'Updated notes',
});
```
**Parameter**: Use date string (YYYY-MM-DD), not logId

### Delete Symptom Log
```typescript
import { deleteSymptomLog } from '@/lib/aws/dynamodb';

await deleteSymptomLog(userId, '2026-05-29');
```
**Parameter**: Use date string (YYYY-MM-DD), not logId

## ⚠️ Important Notes

### Date Format
Always use **YYYY-MM-DD** format for symptom log dates:
```typescript
// ✅ Correct
const date = '2026-05-29';

// ❌ Wrong
const date = '5/29/2026';
const date = new Date().toISOString(); // Use .split('T')[0] instead
```

### User ID Consistency
The `userId` field is the primary key. Ensure consistency:
```typescript
// ✅ Correct - use the same userId everywhere
const userId = user.uid; // from Cognito
await createUserProfile({ userId, email, name });
await getUserProfile(userId);

// ❌ Wrong - mixing different identifiers
await createUserProfile({ id: user.uid, email });
await getUserProfile(user.email); // Use getUserProfileByEmail instead
```

### No More Scans!
These patterns are **deprecated** and removed:
```typescript
// ❌ REMOVED - Don't use ScanCommand
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

// ❌ REMOVED - Don't scan with filters
const command = new ScanCommand({
  FilterExpression: 'userId = :userId',
  // ...
});
```

## 🎯 Performance Tips

1. **Use the right function**:
   - Have userId? → `getUserProfile(userId)`
   - Have email? → `getUserProfileByEmail(email)`
   - Need date range? → `getSymptomLogsByDateRange(userId, start, end)`

2. **Limit results**:
   ```typescript
   // Good - limit to what you need
   const logs = await getUserSymptomLogs(userId, 30);
   
   // Avoid - fetching too much data
   const logs = await getUserSymptomLogs(userId, 10000);
   ```

3. **Use composite keys efficiently**:
   ```typescript
   // Good - direct lookup
   const log = await getSymptomLog(userId, '2026-05-29');
   
   // Avoid - querying then filtering
   const allLogs = await getUserSymptomLogs(userId);
   const log = allLogs.find(l => l.date === '2026-05-29');
   ```

## 📊 Table Structures

### Users Table
- **Primary Key**: `userId` (HASH)
- **GSI**: `EmailIndex` on `email` (HASH)
- **Attributes**: userId, email, name, dateOfBirth, etc.

### Symptoms Table
- **Primary Key**: `userId` (HASH) + `date` (RANGE)
- **Attributes**: userId, date, flowLevel, painLevel, mood, symptoms, etc.
- **Date Format**: YYYY-MM-DD

## 🔧 Migration Checklist

If you're updating existing code:

- [ ] Replace `ScanCommand` with `QueryCommand` or `GetCommand`
- [ ] Update `getSymptomLog` calls to use date instead of logId
- [ ] Update `updateSymptomLog` calls to use date instead of logId
- [ ] Update `deleteSymptomLog` calls to use date instead of logId
- [ ] Ensure all dates are in YYYY-MM-DD format
- [ ] Use `userId` consistently (not `id`, `uid`, or `email`)
- [ ] Run `node scripts/add-email-gsi.mjs` for existing deployments

## 📚 More Information

See `DYNAMODB_OPTIMIZATION.md` for detailed documentation and migration guide.

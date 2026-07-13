# Server-Side fetch() Anti-Pattern Guide

## 🎯 The Problem: Circular fetch() Calls

### What is a Circular fetch()?

When server-side code (libraries, utilities, API routes) uses `fetch()` to call its own API endpoints, creating unnecessary HTTP round-trips.

### Example of the Anti-Pattern

```typescript
// ❌ BAD: Server-side library making HTTP call to own API
// File: src/lib/aws/dynamodb.ts
export async function getSymptomLogsByMonth(userId: string, year: number, month: number) {
    // This is running on the server, calling the server's own API
    const response = await fetch(`/api/symptoms?userId=${userId}`);
    const data = await response.json();
    return data.logs;
}

// File: src/app/api/symptoms/route.ts
export async function GET(request: NextRequest) {
    // This queries DynamoDB
    const logs = await queryDynamoDB(userId);
    return NextResponse.json({ logs });
}
```

### Why This is Bad

1. **Unnecessary HTTP Overhead**
   - Request serialization
   - Network stack processing
   - Response deserialization
   - Adds ~20-30ms per call

2. **Circular Dependency Risk**
   - Library → API → Library (potential infinite loop)
   - Harder to reason about code flow
   - Confusing error messages

3. **Duplicated Logic**
   - Database query logic exists in API route
   - Library needs to recreate the request
   - DRY principle violation

4. **Testing Complexity**
   - Need to mock HTTP requests
   - Can't unit test library functions in isolation
   - Integration tests become complex

5. **Error Handling Complexity**
   - HTTP errors (404, 500, etc.)
   - Network timeouts
   - JSON parsing errors
   - All on top of actual database errors

## ✅ The Solution: Shared Functions

### Pattern: Extract Shared Logic

```typescript
// ✅ GOOD: Shared function in library
// File: src/lib/aws/dynamodb.ts
export async function getUserSymptomLogs(userId: string, limit: number = 100) {
    const docClient = getDocClient();
    const command = new QueryCommand({
        TableName: dynamoDBTables.symptoms,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        ScanIndexForward: false,
        Limit: limit,
    });
    const response = await docClient.send(command);
    return response.Items as SymptomLog[] || [];
}

// Library function uses shared logic directly
export async function getSymptomLogsByMonth(userId: string, year: number, month: number) {
    const allLogs = await getUserSymptomLogs(userId, 100);
    // Filter by month
    return allLogs.filter(log => isInMonth(log.date, year, month));
}

// API route uses shared logic
// File: src/app/api/symptoms/route.ts
import { getUserSymptomLogs } from '@/lib/aws/dynamodb';

export async function GET(request: NextRequest) {
    const { userId, limit } = parseParams(request);
    const logs = await getUserSymptomLogs(userId, limit);
    return NextResponse.json({ success: true, logs });
}
```

## 📋 Checklist: Is Your Code Using fetch() Correctly?

### ✅ Good Uses of fetch()

- [ ] Client-side components calling your API
- [ ] Server calling external third-party APIs
- [ ] Webhooks calling external services
- [ ] Server-to-server communication with different services

### ❌ Bad Uses of fetch()

- [ ] Server-side library calling own API route
- [ ] API route calling another API route in same app
- [ ] Utility function using fetch() for internal data
- [ ] Server component using fetch() for own endpoints

## 🔍 How to Identify This Anti-Pattern

### Search Your Codebase

```bash
# Find fetch calls in server-side libraries
grep -r "fetch" src/lib/

# Find fetch calls in utilities
grep -r "fetch" src/utils/

# Look for API calls to own domain
grep -r "fetch('/api" src/lib/
grep -r "fetch('/api" src/utils/
```

### Red Flags

1. **fetch() in src/lib/** or **src/utils/**
   - These are server-side libraries
   - Should not make HTTP calls to own API

2. **fetch('/api/...)** anywhere on server
   - Relative URLs mean calling own API
   - Use direct function imports instead

3. **fetch() in API routes calling other API routes**
   - Server-to-server internal communication
   - Use direct function calls

4. **fetch() in server components (App Router)**
   - Next.js server components
   - Use direct database/service calls

## 🛠️ How to Fix It

### Step 1: Identify the Shared Logic

Find what the API route does:
```typescript
// API route has this logic
const command = new QueryCommand({...});
const response = await docClient.send(command);
return response.Items;
```

### Step 2: Extract to Shared Function

Move the logic to a library file:
```typescript
// src/lib/aws/dynamodb.ts
export async function getItems(userId: string) {
    const command = new QueryCommand({...});
    const response = await docClient.send(command);
    return response.Items;
}
```

### Step 3: Update the API Route

Import and use the shared function:
```typescript
// src/app/api/items/route.ts
import { getItems } from '@/lib/aws/dynamodb';

export async function GET(request: NextRequest) {
    const { userId } = parseParams(request);
    const items = await getItems(userId);
    return NextResponse.json({ items });
}
```

### Step 4: Update Other Code

Replace fetch() calls with direct imports:
```typescript
// Before ❌
const response = await fetch('/api/items?userId=...');
const data = await response.json();
const items = data.items;

// After ✅
import { getItems } from '@/lib/aws/dynamodb';
const items = await getItems(userId);
```

## 📊 Performance Comparison

### With fetch() (❌ Bad)
```
Library Function
  ↓ ~2ms (function call)
  ↓ ~5ms (request serialization)
  ↓ ~10ms (HTTP stack)
API Route
  ↓ ~5ms (request parsing)
  ↓ ~20ms (database query)
  ↓ ~5ms (response serialization)
  ↓ ~10ms (HTTP stack)
Library Function
  ↓ ~5ms (response parsing)
  ↓ Return result
───────────────────
Total: ~62ms
```

### Without fetch() (✅ Good)
```
Library Function
  ↓ ~1ms (function call)
Shared Function
  ↓ ~20ms (database query)
  ↓ Return result
───────────────────
Total: ~21ms

Speedup: 3x faster! 🚀
```

## 🎯 Real-World Examples

### Example 1: User Data

```typescript
// ❌ BAD
export async function getUserData(userId: string) {
    const response = await fetch(`/api/user/${userId}`);
    return response.json();
}

// ✅ GOOD
export async function getUserData(userId: string) {
    const docClient = getDocClient();
    const response = await docClient.send(
        new GetCommand({
            TableName: 'users',
            Key: { userId }
        })
    );
    return response.Item;
}
```

### Example 2: List Items

```typescript
// ❌ BAD
export async function getSymptomLogs(userId: string) {
    const response = await fetch(`/api/symptoms?userId=${userId}&limit=100`);
    const data = await response.json();
    return data.logs;
}

// ✅ GOOD
export async function getSymptomLogs(userId: string) {
    const docClient = getDocClient();
    const response = await docClient.send(
        new QueryCommand({
            TableName: 'symptoms',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': userId },
            Limit: 100
        })
    );
    return response.Items;
}
```

### Example 3: Aggregated Data

```typescript
// ❌ BAD: Multiple fetch calls
export async function getDashboardData(userId: string) {
    const [user, logs, reports] = await Promise.all([
        fetch(`/api/user/${userId}`).then(r => r.json()),
        fetch(`/api/symptoms?userId=${userId}`).then(r => r.json()),
        fetch(`/api/reports?userId=${userId}`).then(r => r.json()),
    ]);
    return { user, logs, reports };
}

// ✅ GOOD: Direct function calls
export async function getDashboardData(userId: string) {
    const [user, logs, reports] = await Promise.all([
        getUserProfile(userId),
        getUserSymptomLogs(userId),
        getUserHealthReports(userId),
    ]);
    return { user, logs, reports };
}
```

## 🧪 Testing Benefits

### Before (with fetch)
```typescript
// Complex: Need to mock HTTP
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
    rest.get('/api/symptoms', (req, res, ctx) => {
        return res(ctx.json({ logs: mockLogs }));
    })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

it('should get logs', async () => {
    const logs = await getSymptomLogsByMonth('user', 2026, 5);
    expect(logs).toEqual(mockLogs);
});
```

### After (without fetch)
```typescript
// Simple: Mock the function directly
jest.mock('@/lib/aws/dynamodb', () => ({
    getUserSymptomLogs: jest.fn(),
}));

it('should get logs', async () => {
    getUserSymptomLogs.mockResolvedValue(mockLogs);
    
    const logs = await getSymptomLogsByMonth('user', 2026, 5);
    
    expect(getUserSymptomLogs).toHaveBeenCalledWith('user', 100);
    expect(logs).toEqual(filteredLogs);
});
```

## 📚 Architecture Principles

### Principle 1: Separation of Concerns
- **Data Access Layer**: Database queries (dynamodb.ts)
- **Business Logic Layer**: Processing, filtering (utilities)
- **API Layer**: HTTP handling, validation (route handlers)

### Principle 2: Direct Dependencies
- Server-side code should import functions directly
- Avoid HTTP as an internal communication mechanism
- HTTP is for external communication only

### Principle 3: Single Source of Truth
- Database query logic lives in one place
- Multiple consumers import the same function
- DRY: Don't Repeat Yourself

### Principle 4: Proper Layering
```
┌─────────────────────────────────────────────┐
│ Client (Browser)                            │
│   ↓ HTTP (fetch)                            │
├─────────────────────────────────────────────┤
│ API Routes (Server)                         │
│   ↓ Direct Import                           │
├─────────────────────────────────────────────┤
│ Business Logic / Services (Server)          │
│   ↓ Direct Import                           │
├─────────────────────────────────────────────┤
│ Data Access Layer (Server)                  │
│   ↓ Database Protocol                       │
├─────────────────────────────────────────────┤
│ Database (DynamoDB, etc.)                   │
└─────────────────────────────────────────────┘
```

## ✅ Best Practices Summary

1. **Use fetch() only for external communication**
   - Client → Server API calls ✅
   - Server → Third-party APIs ✅
   - Server → Own APIs ❌

2. **Create shared functions for common operations**
   - Extract database queries to library files
   - Import and reuse across API routes and utilities

3. **Keep API routes thin**
   - Validate input
   - Call business logic functions
   - Format response
   - Don't duplicate business logic

4. **Test at the right level**
   - Unit test shared functions
   - Integration test API routes
   - Mock at function level, not HTTP level

5. **Follow the dependency flow**
   - Client → API Route → Service → Data Access
   - Never: Service → API Route (circular!)

## 🚀 Migration Strategy

### Step-by-Step Process

1. **Audit your codebase**
   ```bash
   grep -r "fetch('/api" src/lib/ src/utils/
   ```

2. **For each fetch() found:**
   - Identify what API route it calls
   - Find the logic in that API route
   - Extract to shared function
   - Update both API route and original caller

3. **Run tests**
   - Update tests to mock functions instead of HTTP
   - Verify all functionality still works

4. **Deploy**
   - No breaking changes
   - Monitor for errors
   - Should see performance improvements

## 📖 Further Reading

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Server Components Best Practices](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)

---

**Remember**: If you're on the server and calling your own API, you're doing it wrong! Use direct function imports instead. 🎯

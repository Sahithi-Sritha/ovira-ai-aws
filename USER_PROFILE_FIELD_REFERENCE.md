# UserProfile Field Reference

## Quick Reference: Cycle Length Field

### ✅ Correct Usage
```typescript
// Use avgCycleLength - this is the canonical field
const cycleLength = profile.avgCycleLength || 28;

// When creating a profile
const newProfile: UserProfile = {
    uid: userId,
    email: userEmail,
    avgCycleLength: 28,  // ✅ Correct
    // ... other fields
};

// When updating a profile
await updateUserProfile(userId, {
    avgCycleLength: 30,  // ✅ Correct
});
```

### ❌ Incorrect Usage
```typescript
// DON'T use averageCycleLength - this field was removed
const cycleLength = profile.averageCycleLength;  // ❌ Wrong - field doesn't exist

// DON'T use fallback to averageCycleLength
const cycleLength = profile.avgCycleLength || profile.averageCycleLength || 28;  // ❌ Unnecessary

// DON'T create profiles with averageCycleLength
const newProfile = {
    uid: userId,
    averageCycleLength: 28,  // ❌ Wrong field name
};
```

## UserProfile Type Definition

```typescript
export interface UserProfile {
    // Identification
    id?: string;                          // Optional for backward compatibility
    uid: string;                          // Required - Cognito user ID
    email: string;                        // Required - User email
    userId?: string;                      // Added for DynamoDB compatibility
    
    // Basic Info
    displayName?: string;
    photoURL?: string;
    ageRange: '13-17' | '18-24' | '25-34' | '35-44' | '45+';
    language: string;
    onboardingComplete: boolean;
    createdAt: string;                    // ISO 8601 string
    
    // Activity & Physical
    activityLevel?: string;
    heightRange?: string;
    
    // Cycle History
    lastPeriodStart?: string;             // ISO 8601 string
    previousPeriodDates?: string[];
    avgCycleLength: number;               // ✅ Canonical cycle length field (required)
    cycleRegularity?: string;
    
    // Health
    conditions: string[];
    
    // Diet & Lifestyle
    dietType?: string;
    stapleGrain?: string;
    ironRichFoodFrequency?: string;
    waterIntake?: number;
    caffeineIntake?: string;
    sleepHabit?: string;
    
    // Recent Symptoms
    recentPainLevel?: string;
    recentMoodPattern?: string;
    regularSymptoms?: string[];
    hasDoctorConsultation?: string;
    personalGoal?: string;
    
    // AI Context
    healthContextSummary?: string;
    
    // Premium Features
    isPremium?: boolean;
    
    // AI Preferences
    aiPersonality?: 'warm' | 'informative' | 'detail';
    aiResponseLength?: 'concise' | 'standard' | 'detailed';
    aiModelPreference?: 'auto' | 'menstllama' | 'standard';
    aiLanguage?: string;
}
```

## Common Patterns

### Creating a New User
```typescript
import { createUserProfile } from '@/lib/aws/dynamodb';

const newUser: Partial<UserProfile> = {
    userId: cognitoSub,
    uid: cognitoSub,
    email: userEmail,
    displayName: userName,
    ageRange: '25-34',
    avgCycleLength: 28,              // ✅ Use avgCycleLength
    conditions: [],
    language: 'en',
    onboardingComplete: false,
};

await createUserProfile(newUser);
```

### Updating Cycle Information
```typescript
import { updateUserProfile } from '@/lib/aws/dynamodb';

await updateUserProfile(userId, {
    avgCycleLength: 30,              // ✅ Use avgCycleLength
    lastPeriodStart: '2026-05-01',
    cycleRegularity: 'regular',
});
```

### Reading Cycle Information
```typescript
import { getUserProfile } from '@/lib/aws/dynamodb';

const profile = await getUserProfile(userId);

if (profile) {
    const cycleLength = profile.avgCycleLength || 28;  // ✅ Simple fallback
    console.log(`User's cycle length: ${cycleLength} days`);
}
```

### Building Health Context
```typescript
import { buildHealthContext } from '@/lib/buildHealthContext';

const healthContext = buildHealthContext(profile);
// Internally uses: profile.avgCycleLength || 28
```

### Cycle Analysis
```typescript
import { getCurrentCycleInfo } from '@/lib/utils/cycle-analysis';

const cycleInfo = getCurrentCycleInfo(
    logs,
    profile.lastPeriodStart ? new Date(profile.lastPeriodStart) : null,
    profile.avgCycleLength  // ✅ Pass avgCycleLength
);

// cycleInfo.avgCycleLength contains the calculated or fallback value
console.log(`Average cycle: ${cycleInfo.avgCycleLength} days`);
```

## Field History

### Why avgCycleLength?

**Previous State (Confusing):**
- `averageCycleLength: number` (required) - Full name
- `avgCycleLength?: number` (optional) - Abbreviated name
- Code used fallbacks: `profile.avgCycleLength || profile.averageCycleLength || 28`

**Current State (Clear):**
- `avgCycleLength: number` (required) - Single canonical field
- Code uses simple fallback: `profile.avgCycleLength || 28`

**Decision Rationale:**
- Consistency with other abbreviated fields (`uid`, `docId`)
- Shorter without losing clarity
- `avg` is a widely recognized abbreviation
- Reduces cognitive load (one field to remember)

## Migration Notes

### For Existing Code

If you're updating old code that uses `averageCycleLength`:

```typescript
// Old code ❌
const length = profile.averageCycleLength;

// New code ✅
const length = profile.avgCycleLength;
```

### For Data in Database

**No migration required!** DynamoDB is schema-less:
- Old records with `averageCycleLength` will continue to work
- New records will use `avgCycleLength`
- Application handles both transparently through defaults

### For New Features

Always use `avgCycleLength`:
```typescript
// Creating new profile
const profile: UserProfile = {
    // ...
    avgCycleLength: 28,  // ✅ Always use this field name
};
```

## Type Safety

TypeScript will now enforce the correct field name:

```typescript
// ✅ This compiles
const profile: UserProfile = {
    uid: 'user123',
    email: 'user@example.com',
    ageRange: '25-34',
    avgCycleLength: 28,
    conditions: [],
    language: 'en',
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
};

// ❌ This won't compile
const badProfile: UserProfile = {
    uid: 'user123',
    email: 'user@example.com',
    ageRange: '25-34',
    averageCycleLength: 28,  // ❌ Error: Property 'averageCycleLength' does not exist
    conditions: [],
    language: 'en',
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
};
```

## Related Interfaces

### CycleInfo Interface
```typescript
export interface CycleInfo {
    avgCycleLength: number;         // ✅ Consistent with UserProfile
    lastPeriodStart: Date;
    nextPeriodDate: Date;
    cycleDay: number;
    daysUntilNextPeriod: number;
    currentPhase: string;
    periodStartDates: Date[];
    hasSufficientData: boolean;
}
```

## Best Practices

### 1. Always Use Default Fallback
```typescript
// ✅ Good - handles missing data gracefully
const cycleLength = profile.avgCycleLength || 28;

// ❌ Bad - could be undefined
const cycleLength = profile.avgCycleLength;
```

### 2. Validate on Input
```typescript
// ✅ Good - validate user input
const cycleLength = Math.max(21, Math.min(45, inputValue));

// ❌ Bad - accept any value
const cycleLength = inputValue;
```

### 3. Use TypeScript Types
```typescript
// ✅ Good - type-safe
const profile: UserProfile = { /* ... */ };

// ❌ Bad - loses type safety
const profile: any = { /* ... */ };
```

## Common Questions

### Q: What if a user has no cycle length recorded?
**A:** Use the default value of 28 days: `profile.avgCycleLength || 28`

### Q: What's the valid range for cycle length?
**A:** Typically 21-45 days. Most users fall in the 25-35 day range.

### Q: Should I validate cycle length on input?
**A:** Yes! Validate user input to be within reasonable bounds (e.g., 21-45 days).

### Q: What if old data has averageCycleLength?
**A:** DynamoDB is schema-less. The application handles this through default values. No migration needed.

### Q: Can users change their cycle length?
**A:** Yes, it can be updated at any time through the profile settings.

## See Also

- [CYCLE_LENGTH_FIELD_FIX.md](./CYCLE_LENGTH_FIELD_FIX.md) - Detailed changes documentation
- [src/types/index.ts](./src/types/index.ts) - Full type definitions
- [src/lib/buildHealthContext.ts](./src/lib/buildHealthContext.ts) - Health context usage
- [src/lib/utils/cycle-analysis.ts](./src/lib/utils/cycle-analysis.ts) - Cycle calculations

---

**Last Updated**: 2026-05-29  
**Field Name**: `avgCycleLength`  
**Status**: ✅ Canonical Field

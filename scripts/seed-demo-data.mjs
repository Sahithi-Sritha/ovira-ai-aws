/**
 * Seed DynamoDB with 90 days of realistic PCOS symptom data for demo user.
 *
 * Usage:
 *   node scripts/seed-demo-data.mjs
 *
 * Requires AWS SDK v3 (already installed in the project).
 * Uses credentials from .env.local.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

// ── Config ──────────────────────────────────────────────────────────────────
const REGION = process.env.AWS_REGION || 'us-east-1';
const USERS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'ovira-users';
const SYMPTOMS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_SYMPTOMS_TABLE || 'ovira-symptoms';

const DEMO_USER = {
    id: 'demo-user-001',
    uid: 'demo-user-001',
    email: 'demo@ovira.ai',
    displayName: 'Demo User',
    ageRange: '25-34',
    conditions: ['PCOS'],
    language: 'en',
    onboardingComplete: true,
    averageCycleLength: 32,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
};

// ── DynamoDB client ─────────────────────────────────────────────────────────
const rawClient = new DynamoDBClient({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
const docClient = DynamoDBDocumentClient.from(rawClient);

// ── Helpers ─────────────────────────────────────────────────────────────────
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, min, max) {
    const count = rand(min, max);
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// ── Cycle phase calculator ──────────────────────────────────────────────────
function getCyclePhase(dayInCycle, cycleLength) {
    if (dayInCycle <= 6) return 'menstrual';         // Days 1-6: period
    if (dayInCycle <= 13) return 'follicular';        // Days 7-13: follicular
    if (dayInCycle <= 17) return 'ovulation';         // Days 14-17: ovulation window
    if (dayInCycle <= cycleLength - 5) return 'luteal-early';  // Early luteal
    return 'luteal-late';                             // Last 5 days: PMS
}

// ── Symptom generator per phase ─────────────────────────────────────────────
const PCOS_SYMPTOMS = {
    menstrual: ['Cramps', 'Bloating', 'Fatigue', 'Back pain', 'Headache', 'Mood swings'],
    follicular: ['Bloating', 'Acne'],
    ovulation: ['Bloating', 'Breast tenderness'],
    'luteal-early': ['Bloating', 'Acne', 'Fatigue', 'Cravings'],
    'luteal-late': ['Cramps', 'Bloating', 'Mood swings', 'Fatigue', 'Acne', 'Anxiety', 'Insomnia', 'Cravings', 'Headache'],
};

function generateLog(date, dayInCycle, cycleLength) {
    const phase = getCyclePhase(dayInCycle, cycleLength);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // ── Flow ────────────────────────────────────────────────────────────────
    let flowLevel;
    if (dayInCycle === 1) flowLevel = 'medium';
    else if (dayInCycle === 2 || dayInCycle === 3) flowLevel = 'heavy';
    else if (dayInCycle === 4) flowLevel = 'medium';
    else if (dayInCycle === 5 || dayInCycle === 6) flowLevel = 'light';
    else flowLevel = 'none';

    // ── Pain ─────────────────────────────────────────────────────────────────
    let painLevel;
    switch (phase) {
        case 'menstrual':
            painLevel = dayInCycle <= 3 ? rand(6, 9) : rand(3, 6);
            break;
        case 'follicular':
            painLevel = rand(0, 2);
            break;
        case 'ovulation':
            painLevel = rand(2, 5); // Mid-cycle pain (mittelschmerz)
            break;
        case 'luteal-early':
            painLevel = rand(1, 3);
            break;
        case 'luteal-late':
            painLevel = rand(3, 6); // PMS cramps
            break;
        default:
            painLevel = rand(0, 3);
    }

    // PCOS tends toward slightly higher pain — add a bump
    painLevel = clamp(painLevel + (Math.random() < 0.3 ? 1 : 0), 0, 10);

    // ── Mood ─────────────────────────────────────────────────────────────────
    let mood;
    switch (phase) {
        case 'menstrual':
            mood = pick(['bad', 'bad', 'neutral', 'terrible']);
            break;
        case 'follicular':
            mood = pick(['good', 'good', 'great', 'neutral']);
            break;
        case 'ovulation':
            mood = pick(['great', 'great', 'good']);
            break;
        case 'luteal-early':
            mood = pick(['neutral', 'good', 'neutral']);
            break;
        case 'luteal-late':
            mood = pick(['bad', 'terrible', 'bad', 'neutral']);
            break;
        default:
            mood = 'neutral';
    }

    // ── Energy ───────────────────────────────────────────────────────────────
    let energyLevel;
    switch (phase) {
        case 'menstrual':
            energyLevel = pick(['low', 'low', 'medium']);
            break;
        case 'follicular':
            energyLevel = pick(['medium', 'high', 'medium']);
            break;
        case 'ovulation':
            energyLevel = pick(['high', 'high', 'medium']);
            break;
        case 'luteal-early':
            energyLevel = pick(['medium', 'medium', 'low']);
            break;
        case 'luteal-late':
            energyLevel = pick(['low', 'low', 'medium']);
            break;
        default:
            energyLevel = 'medium';
    }

    // ── Sleep ────────────────────────────────────────────────────────────────
    let sleepHours;
    switch (phase) {
        case 'menstrual':
            sleepHours = rand(5, 7) + (Math.random() < 0.5 ? 0.5 : 0);
            break;
        case 'follicular':
            sleepHours = rand(7, 8) + (Math.random() < 0.5 ? 0.5 : 0);
            break;
        case 'ovulation':
            sleepHours = rand(7, 9);
            break;
        case 'luteal-early':
            sleepHours = rand(6, 8);
            break;
        case 'luteal-late':
            sleepHours = rand(5, 7) + (Math.random() < 0.5 ? 0.5 : 0);
            break;
        default:
            sleepHours = rand(6, 8);
    }

    // ── Symptoms ─────────────────────────────────────────────────────────────
    const phaseSymptoms = PCOS_SYMPTOMS[phase] || [];
    const minSymptoms = phase === 'menstrual' || phase === 'luteal-late' ? 2 : 0;
    const maxSymptoms = phase === 'menstrual' || phase === 'luteal-late' ? 4 : 2;
    const symptoms = phaseSymptoms.length > 0 ? pickMany(phaseSymptoms, minSymptoms, maxSymptoms) : [];

    // ── Notes ────────────────────────────────────────────────────────────────
    const phaseNotes = {
        menstrual: [
            'Heavy cramps today, took ibuprofen.',
            'Period started, moderate flow.',
            'Feeling tired and crampy.',
            'Used heating pad for cramps.',
            'Lighter flow today, feeling better.',
        ],
        follicular: [
            'Feeling more energetic!',
            'Skin clearing up.',
            'Good workout today.',
            '',
            '',
        ],
        ovulation: [
            'Feeling great, lots of energy.',
            'Slight bloating but good mood.',
            '',
            '',
        ],
        'luteal-early': [
            'Cravings starting.',
            'Slight bloating.',
            '',
            '',
        ],
        'luteal-late': [
            'PMS hitting hard today.',
            'Mood swings and cravings.',
            'Trouble sleeping, anxious.',
            'Acne flare-up, feeling low.',
            'Waiting for period to start.',
        ],
    };
    const notes = pick(phaseNotes[phase] || ['']);

    const id = `${DEMO_USER.id}_${dateStr}`;

    return {
        id,
        userId: DEMO_USER.id,
        date: dateStr,
        flowLevel,
        painLevel,
        mood,
        energyLevel,
        sleepHours,
        symptoms,
        notes,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
    };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🌱 Seeding DynamoDB with demo data...\n');

    // 1. Create demo user profile
    console.log('📝 Creating demo user profile...');
    await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: DEMO_USER,
    }));
    console.log(`   ✓ User "${DEMO_USER.displayName}" created in ${USERS_TABLE}\n`);

    // 2. Generate 90 days of symptom logs
    console.log('📊 Generating 90 days of symptom logs...');
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const cycleLength = 32;
    const logs = [];

    // Work backward from today. First period started ~88 days ago.
    // Cycle 1: days 1-32 (88 to 57 days ago)
    // Cycle 2: days 1-32 (56 to 25 days ago)
    // Cycle 3: days 1-24 partial (24 to 1 days ago) + today
    const firstPeriodStart = new Date(today);
    firstPeriodStart.setDate(firstPeriodStart.getDate() - 88);

    // Also set lastPeriodStart on the user profile (start of cycle 3)
    const cycle3Start = new Date(today);
    cycle3Start.setDate(cycle3Start.getDate() - (88 - 2 * cycleLength));

    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const date = new Date(firstPeriodStart);
        date.setDate(date.getDate() + dayOffset);

        // Calculate which day of which cycle we're in
        const totalDays = dayOffset;
        const dayInCycle = (totalDays % cycleLength) + 1;

        const log = generateLog(date, dayInCycle, cycleLength);
        logs.push(log);
    }

    // 3. Write logs to DynamoDB in batches of 25 (BatchWrite limit)
    const batchSize = 25;
    let written = 0;

    for (let i = 0; i < logs.length; i += batchSize) {
        const batch = logs.slice(i, i + batchSize);
        const putRequests = batch.map(log => ({
            PutRequest: { Item: log },
        }));

        try {
            await docClient.send(new BatchWriteCommand({
                RequestItems: {
                    [SYMPTOMS_TABLE]: putRequests,
                },
            }));
            written += batch.length;
            process.stdout.write(`\r   Writing: ${written}/${logs.length} logs`);
        } catch (err) {
            // Fallback to individual puts if batch fails
            console.warn(`\n   ⚠ Batch write failed, falling back to individual puts: ${err.message}`);
            for (const log of batch) {
                await docClient.send(new PutCommand({
                    TableName: SYMPTOMS_TABLE,
                    Item: log,
                }));
                written++;
                process.stdout.write(`\r   Writing: ${written}/${logs.length} logs`);
            }
        }
    }

    // 4. Update user profile with lastPeriodStart
    const lastPeriodStr = cycle3Start.toISOString().split('T')[0];
    await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: {
            ...DEMO_USER,
            lastPeriodStart: lastPeriodStr,
        },
    }));

    console.log(`\n   ✓ ${written} symptom logs written to ${SYMPTOMS_TABLE}`);
    console.log(`\n📅 Data covers: ${logs[0].date} to ${logs[logs.length - 1].date}`);
    console.log(`   Cycle length: ${cycleLength} days`);
    console.log(`   Last period start: ${lastPeriodStr}`);
    console.log(`   Cycles: 2 complete + 1 partial\n`);
    console.log('✅ Seeding complete! Demo user is ready.\n');
    console.log('   Login as: demo@ovira.ai');
    console.log('   Or use the "Try Demo" button on the landing page.\n');
}

main().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});

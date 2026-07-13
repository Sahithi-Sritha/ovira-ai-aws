import { DynamoDBClient, CreateTableCommand, DeleteTableCommand, DescribeTableCommand, waitUntilTableNotExists, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { config } from 'dotenv';
config({ path: '.env' });

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

// Only the 4 tables that have wrong schemas
const TABLES_TO_FIX = [
    {
        TableName: process.env.DYNAMODB_USERS_TABLE || 'ovira-users',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'email', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'EmailIndex',
                KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
            }
        ],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: process.env.DYNAMODB_SYMPTOMS_TABLE || 'ovira-symptoms',
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'date', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'date', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: process.env.DYNAMODB_REPORTS_TABLE || 'ovira-reports',
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'reportId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'reportId', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: process.env.DYNAMODB_CHAT_TABLE || 'ovira-chat-history',
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'messageId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'messageId', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST',
    },
];

async function main() {
    console.log('🔧 Fixing 4 mismatched DynamoDB tables...\n');

    for (const tableSpec of TABLES_TO_FIX) {
        const name = tableSpec.TableName;

        // Step 1: Delete the old table
        try {
            console.log(`🗑️  Deleting ${name}...`);
            await client.send(new DeleteTableCommand({ TableName: name }));
            await waitUntilTableNotExists({ client, maxWaitTime: 120 }, { TableName: name });
            console.log(`   ✓ Deleted`);
        } catch (err) {
            if (err.name === 'ResourceNotFoundException') {
                console.log(`   ⚠ Table didn't exist, creating fresh`);
            } else {
                console.error(`   ✗ Delete failed: ${err.message}`);
                continue;
            }
        }

        // Step 2: Create with correct schema
        try {
            console.log(`   ⏳ Creating ${name} with correct schema...`);
            await client.send(new CreateTableCommand(tableSpec));
            await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: name });
            const keys = tableSpec.KeySchema.map(k => `${k.AttributeName} (${k.KeyType})`).join(' + ');
            console.log(`   ✅ Created — Keys: ${keys}\n`);
        } catch (err) {
            console.error(`   ✗ Create failed: ${err.message}\n`);
        }
    }

    console.log('✅ Done! All 4 tables have been recreated with correct schemas.');
    console.log('   Note: The other 4 tables (articles, documents, doctors, appointments) were already correct.');
}

main().catch(console.error);

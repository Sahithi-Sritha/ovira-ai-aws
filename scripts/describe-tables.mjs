import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { config } from 'dotenv';
config({ path: '.env' });

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const tables = [
    process.env.DYNAMODB_USERS_TABLE || 'ovira-users',
    process.env.DYNAMODB_SYMPTOMS_TABLE || 'ovira-symptoms',
    process.env.DYNAMODB_REPORTS_TABLE || 'ovira-reports',
    process.env.DYNAMODB_CHAT_TABLE || 'ovira-chat-history',
    process.env.DYNAMODB_ARTICLES_TABLE || 'ovira-articles',
    process.env.DYNAMODB_DOCUMENTS_TABLE || 'ovira-documents',
    process.env.DYNAMODB_DOCTORS_TABLE || 'ovira-doctors',
    process.env.DYNAMODB_APPOINTMENTS_TABLE || 'ovira-appointments',
];

for (const tableName of tables) {
    try {
        const res = await client.send(new DescribeTableCommand({ TableName: tableName }));
        const keys = res.Table.KeySchema.map(k => `${k.AttributeName} (${k.KeyType})`).join(', ');
        const gsi = res.Table.GlobalSecondaryIndexes?.map(g => {
            const gsiKeys = g.KeySchema.map(k => `${k.AttributeName} (${k.KeyType})`).join(', ');
            return `  GSI "${g.IndexName}": ${gsiKeys}`;
        }).join('\n') || '  (none)';
        console.log(`\n${tableName}:`);
        console.log(`  Keys: ${keys}`);
        console.log(`  GSIs:\n${gsi}`);
        console.log(`  Items: ${res.Table.ItemCount}`);
    } catch (err) {
        console.log(`\n${tableName}: ${err.name} - ${err.message}`);
    }
}

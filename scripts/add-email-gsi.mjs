import { DynamoDBClient, UpdateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { config } from 'dotenv';
config({ path: '.env.local' });

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const TABLE_NAME = process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'ovira-users';

async function addEmailGSI() {
    try {
        console.log(`🔍 Checking table ${TABLE_NAME}...`);
        
        // Check if GSI already exists
        const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
        const tableDescription = await client.send(describeCommand);
        
        const existingGSIs = tableDescription.Table?.GlobalSecondaryIndexes || [];
        const emailIndexExists = existingGSIs.some(gsi => gsi.IndexName === 'EmailIndex');
        
        if (emailIndexExists) {
            console.log('✓ EmailIndex GSI already exists on the table');
            return;
        }
        
        console.log('⏳ Adding EmailIndex GSI to the users table...');
        
        const updateCommand = new UpdateTableCommand({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                { AttributeName: 'email', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName: 'EmailIndex',
                        KeySchema: [
                            { AttributeName: 'email', KeyType: 'HASH' }
                        ],
                        Projection: {
                            ProjectionType: 'ALL'
                        },
                    }
                }
            ],
        });
        
        await client.send(updateCommand);
        
        console.log('✓ EmailIndex GSI creation initiated');
        console.log('⚠️  Note: GSI creation is asynchronous and may take several minutes.');
        console.log('   You can check the status in the AWS Console or by running:');
        console.log(`   aws dynamodb describe-table --table-name ${TABLE_NAME}`);
        
    } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
            console.error(`✗ Table ${TABLE_NAME} does not exist. Please create it first using create-tables.mjs`);
        } else if (error.name === 'ResourceInUseException') {
            console.log('⚠️  Table is currently being updated. Please wait and try again.');
        } else {
            console.error('✗ Error adding GSI:', error.message);
            throw error;
        }
    }
}

addEmailGSI().catch(console.error);

// Server-side only - for use in API routes
// DO NOT import this file in client components

import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { UserProfile, SymptomLog, HealthReport, ChatMessage } from '@/types';

// Server-side DynamoDB client initialization
function getDocClient() {
    const client = new DynamoDBClient({
        region: process.env.AWS_REGION!,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });

    return DynamoDBDocumentClient.from(client, {
        marshallOptions: {
            removeUndefinedValues: true,
            convertClassInstanceToMap: true,
        },
    });
}

// Table names from server-side environment variables
const dynamoDBTables = {
    users: process.env.DYNAMODB_USERS_TABLE || 'ovira-users',
    symptoms: process.env.DYNAMODB_SYMPTOMS_TABLE || 'ovira-symptoms',
    reports: process.env.DYNAMODB_REPORTS_TABLE || 'ovira-reports',
    chatHistory: process.env.DYNAMODB_CHAT_TABLE || 'ovira-chat-history',
    articles: process.env.DYNAMODB_ARTICLES_TABLE || 'ovira-articles',
    documents: process.env.DYNAMODB_DOCUMENTS_TABLE || 'ovira-documents',
    doctors: process.env.DYNAMODB_DOCTORS_TABLE || 'ovira-doctors',
    appointments: process.env.DYNAMODB_APPOINTMENTS_TABLE || 'ovira-appointments',
};

// User Profile Operations
export async function createUserProfile(profile: Partial<UserProfile>): Promise<void> {
    const docClient = getDocClient();

    try {
        console.log('Creating user profile:', profile);

        const item = {
            ...profile,
            userId: profile.userId || profile.uid || profile.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (!item.userId) {
            throw new Error('userId is required to create a user profile');
        }

        console.log('Final item to create:', item);

        const command = new PutCommand({
            TableName: dynamoDBTables.users,
            Item: item,
        });

        await docClient.send(command);
        console.log('User profile created successfully');
    } catch (error: any) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const docClient = getDocClient();

    console.log(`Getting user profile for userId: ${userId}`);

    try {
        // Direct GetCommand using userId as primary key
        const command = new GetCommand({
            TableName: dynamoDBTables.users,
            Key: { userId },
        });

        const response = await docClient.send(command);
        
        if (response.Item) {
            console.log('User profile found');
            return response.Item as UserProfile;
        }

        console.log('No user profile found');
        return null;
    } catch (error: any) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    const docClient = getDocClient();

    console.log(`Getting user profile by email: ${email}`);

    try {
        // Use EmailIndex GSI for email lookups
        const command = new QueryCommand({
            TableName: dynamoDBTables.users,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email,
            },
            Limit: 1,
        });

        const response = await docClient.send(command);
        
        if (response.Items && response.Items.length > 0) {
            console.log('User profile found by email');
            return response.Items[0] as UserProfile;
        }

        console.log('No user profile found for email');
        return null;
    } catch (error: any) {
        console.error('Error getting user profile by email:', error);
        return null;
    }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const docClient = getDocClient();

    try {
        console.log(`Updating user profile for userId: ${userId}`);

        // Build update expression
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        Object.entries(updates).forEach(([key, value], index) => {
            const attrName = `#attr${index}`;
            const attrValue = `:val${index}`;
            updateExpressions.push(`${attrName} = ${attrValue}`);
            expressionAttributeNames[attrName] = key;
            expressionAttributeValues[attrValue] = value;
        });

        // Add updatedAt timestamp
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const updateCommand = new UpdateCommand({
            TableName: dynamoDBTables.users,
            Key: { userId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
        });

        await docClient.send(updateCommand);
        console.log('User profile updated successfully');
    } catch (error: any) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

export async function deleteUserProfile(userId: string): Promise<void> {
    const docClient = getDocClient();
    const command = new DeleteCommand({
        TableName: dynamoDBTables.users,
        Key: { userId },
    });
    await docClient.send(command);
}

// Symptom Log Operations
export async function createSymptomLog(log: Omit<SymptomLog, 'id'>): Promise<string> {
    const docClient = getDocClient();
    // Normalize date to YYYY-MM-DD for deterministic ID (upsert)
    const dateStr = typeof log.date === 'string' ? log.date : new Date(log.date).toISOString();
    const dateObj = new Date(dateStr);
    const normalizedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const id = `${log.userId}_${normalizedDate}`;

    const command = new PutCommand({
        TableName: dynamoDBTables.symptoms,
        Item: {
            ...log,
            id,
            date: normalizedDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    });

    await docClient.send(command);
    return id;
}

export async function getSymptomLog(userId: string, date: string): Promise<SymptomLog | null> {
    const docClient = getDocClient();
    const command = new GetCommand({
        TableName: dynamoDBTables.symptoms,
        Key: { userId, date },
    });
    const response = await docClient.send(command);
    return (response.Item as SymptomLog) || null;
}

export async function getUserSymptomLogs(userId: string, limit: number = 100): Promise<SymptomLog[]> {
    const docClient = getDocClient();

    try {
        // Query using userId partition key
        const command = new QueryCommand({
            TableName: dynamoDBTables.symptoms,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
            ScanIndexForward: false, // Sort descending (newest first)
            Limit: limit,
        });

        const response = await docClient.send(command);
        return (response.Items as SymptomLog[]) || [];
    } catch (error: any) {
        console.error('Error querying symptom logs:', error);
        throw error;
    }
}

export async function updateSymptomLog(
    userId: string,
    date: string,
    updates: Partial<SymptomLog>
): Promise<void> {
    const docClient = getDocClient();

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value], index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
    });

    // Add updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
        TableName: dynamoDBTables.symptoms,
        Key: { userId, date },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(command);
}

export async function deleteSymptomLog(userId: string, date: string): Promise<void> {
    const docClient = getDocClient();
    const command = new DeleteCommand({
        TableName: dynamoDBTables.symptoms,
        Key: { userId, date },
    });
    await docClient.send(command);
}

// Health Report Operations
export async function createHealthReport(report: Omit<HealthReport, 'id'>): Promise<string> {
    const docClient = getDocClient();
    const id = `report_${Date.now()}`;

    const command = new PutCommand({
        TableName: dynamoDBTables.reports,
        Item: {
            ...report,
            id,
            generatedAt: new Date().toISOString(),
        },
    });

    await docClient.send(command);
    return id;
}

export async function getUserHealthReports(userId: string, limit: number = 50): Promise<HealthReport[]> {
    const docClient = getDocClient();
    const command = new QueryCommand({
        TableName: dynamoDBTables.reports,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId,
        },
        ScanIndexForward: false,
        Limit: limit,
    });

    const response = await docClient.send(command);
    return (response.Items as HealthReport[]) || [];
}

export async function getHealthReport(userId: string, reportId: string): Promise<HealthReport | null> {
    const docClient = getDocClient();
    const command = new GetCommand({
        TableName: dynamoDBTables.reports,
        Key: { userId, reportId },
    });
    const response = await docClient.send(command);
    return (response.Item as HealthReport) || null;
}

// Chat History Operations
export async function saveChatMessage(
    userId: string,
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
): Promise<void> {
    const docClient = getDocClient();
    const timestamp = new Date().toISOString();
    const sortKey = `${sessionId}#${timestamp}`;

    const command = new PutCommand({
        TableName: dynamoDBTables.chatHistory,
        Item: {
            userId,
            sessionId_timestamp: sortKey,
            ...message,
            timestamp,
        },
    });

    await docClient.send(command);
}

export async function getChatHistory(
    userId: string,
    sessionId: string,
    limit: number = 50
): Promise<ChatMessage[]> {
    const docClient = getDocClient();
    const command = new QueryCommand({
        TableName: dynamoDBTables.chatHistory,
        KeyConditionExpression: 'userId = :userId AND begins_with(sessionId_timestamp, :sessionId)',
        ExpressionAttributeValues: {
            ':userId': userId,
            ':sessionId': sessionId,
        },
        ScanIndexForward: true, // Chronological order
        Limit: limit,
    });

    const response = await docClient.send(command);
    return (response.Items as ChatMessage[]) || [];
}

// Batch operations
export async function batchGetSymptomLogs(userId: string, logIds: string[]): Promise<SymptomLog[]> {
    const docClient = getDocClient();
    const results: SymptomLog[] = [];

    // DynamoDB BatchGet has a limit of 100 items
    for (let i = 0; i < logIds.length; i += 100) {
        const batch = logIds.slice(i, i + 100);
        const promises = batch.map((logId) => getSymptomLog(userId, logId));
        const batchResults = await Promise.all(promises);
        results.push(...batchResults.filter((log): log is SymptomLog => log !== null));
    }

    return results;
}

// Query by date range (optimized for calendar view)
export async function getSymptomLogsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
): Promise<SymptomLog[]> {
    const docClient = getDocClient();

    try {
        console.log(`Fetching symptom logs for user ${userId} from ${startDate} to ${endDate}`);

        // Use Query with KeyConditionExpression for efficient date range lookup
        const command = new QueryCommand({
            TableName: dynamoDBTables.symptoms,
            KeyConditionExpression: 'userId = :userId AND #date BETWEEN :startDate AND :endDate',
            ExpressionAttributeNames: {
                '#date': 'date',
            },
            ExpressionAttributeValues: {
                ':userId': userId,
                ':startDate': startDate,
                ':endDate': endDate,
            },
        });

        const response = await docClient.send(command);
        const logs = (response.Items as SymptomLog[]) || [];

        console.log(`Found ${logs.length} symptom logs for date range ${startDate} to ${endDate}`);
        return logs;
    } catch (error) {
        console.error('Error fetching symptom logs by date range:', error);
        throw error;
    }
}
// Query symptom logs by month (optimized for calendar view)
export async function getSymptomLogsByMonth(
    userId: string,
    year: number,
    month: number
): Promise<SymptomLog[]> {
    try {
        console.log(`Fetching symptom logs for user ${userId}, month ${year}-${month + 1}`);

        // Call shared function directly instead of using fetch()
        const allLogs = await getUserSymptomLogs(userId, 100);

        // Calculate start and end dates for the month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Filter logs for the specific month
        const filteredLogs = allLogs.filter(log => {
            // Handle timezone issues by comparing dates properly
            let logDate: string;

            if (log.date.includes('T')) {
                // If it's an ISO string, parse it and format as local date
                const date = new Date(log.date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                logDate = `${year}-${month}-${day}`;
            } else {
                // If it's already in YYYY-MM-DD format, use as is
                logDate = log.date;
            }

            return logDate >= startDateStr && logDate <= endDateStr;
        });

        console.log(`Found ${filteredLogs.length} symptom logs for ${year}-${month + 1}`);
        return filteredLogs;
    } catch (error) {
        console.error('Error fetching symptom logs by month:', error);
        throw error;
    }
}
// Document Operations
export async function getUserDocuments(userId: string): Promise<any[]> {
    const docClient = getDocClient();
    try {
        const command = new QueryCommand({
            TableName: dynamoDBTables.documents,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        });
        const response = await docClient.send(command);
        return response.Items || [];
    } catch (error) {
        console.error('Error fetching user documents:', error);
        return [];
    }
}

export async function updateDocumentSummaryStatus(userId: string, docId: string, shouldInclude: boolean): Promise<void> {
    const docClient = getDocClient();
    try {
        const command = new UpdateCommand({
            TableName: dynamoDBTables.documents,
            Key: { userId, docId },
            UpdateExpression: 'SET shouldIncludeInSummary = :val, updatedAt = :now',
            ExpressionAttributeValues: {
                ':val': shouldInclude,
                ':now': new Date().toISOString(),
            },
        });
        await docClient.send(command);
    } catch (error) {
        console.error('Error updating document summary status:', error);
        throw error;
    }
}

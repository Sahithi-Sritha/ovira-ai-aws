'use client';

import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient, dynamoDBTables } from './config';
import { UserProfile, SymptomLog, HealthReport, ChatMessage } from '@/types';

// User Profile Operations
export async function createUserProfile(profile: Partial<UserProfile>): Promise<void> {
    const docClient = getDocClient();
    const command = new PutCommand({
        TableName: dynamoDBTables.users,
        Item: {
            ...profile,
            createdAt: new Date().toISOString(),
        },
    });
    await docClient.send(command);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const docClient = getDocClient();
    const command = new GetCommand({
        TableName: dynamoDBTables.users,
        Key: { uid: userId },
    });
    const response = await docClient.send(command);
    return (response.Item as UserProfile) || null;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const docClient = getDocClient();

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

    const command = new UpdateCommand({
        TableName: dynamoDBTables.users,
        Key: { uid: userId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(command);
}

export async function deleteUserProfile(userId: string): Promise<void> {
    const docClient = getDocClient();
    const command = new DeleteCommand({
        TableName: dynamoDBTables.users,
        Key: { uid: userId },
    });
    await docClient.send(command);
}

// Symptom Log Operations
export async function createSymptomLog(log: Omit<SymptomLog, 'id'>): Promise<string> {
    const docClient = getDocClient();
    const id = `${log.userId}_${Date.now()}`;

    const command = new PutCommand({
        TableName: dynamoDBTables.symptoms,
        Item: {
            ...log,
            id,
            date: typeof log.date === 'string' ? log.date : new Date(log.date).toISOString(),
            createdAt: new Date().toISOString(),
        },
    });

    await docClient.send(command);
    return id;
}

export async function getSymptomLog(userId: string, logId: string): Promise<SymptomLog | null> {
    const docClient = getDocClient();
    const command = new GetCommand({
        TableName: dynamoDBTables.symptoms,
        Key: { userId, timestamp: logId },
    });
    const response = await docClient.send(command);
    return (response.Item as SymptomLog) || null;
}

export async function getUserSymptomLogs(userId: string, limit: number = 100): Promise<SymptomLog[]> {
    const docClient = getDocClient();
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
}

export async function updateSymptomLog(
    userId: string,
    logId: string,
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
        Key: { userId, timestamp: logId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(command);
}

export async function deleteSymptomLog(userId: string, logId: string): Promise<void> {
    const docClient = getDocClient();
    const command = new DeleteCommand({
        TableName: dynamoDBTables.symptoms,
        Key: { userId, timestamp: logId },
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

// Query by date range
export async function getSymptomLogsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
): Promise<SymptomLog[]> {
    const docClient = getDocClient();
    const command = new QueryCommand({
        TableName: dynamoDBTables.symptoms,
        IndexName: 'date-index', // Assumes GSI exists
        KeyConditionExpression: 'userId = :userId AND #date BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
            '#date': 'date',
        },
        ExpressionAttributeValues: {
            ':userId': userId,
            ':startDate': startDate,
            ':endDate': endDate,
        },
        ScanIndexForward: false,
    });

    const response = await docClient.send(command);
    return (response.Items as SymptomLog[]) || [];
}

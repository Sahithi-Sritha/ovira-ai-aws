/**
 * Complete AI Context Builder
 * 
 * Fetches and aggregates all health data for AI personalization:
 * - User profile (age, diet, conditions, goals)
 * - Uploaded medical documents (summaries only)
 * - Recent symptom trends
 * - Latest health report
 * - Medications & allergies
 */

import { getUserProfile } from './aws/dynamodb';
import { buildHealthContext } from './buildHealthContext';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export interface CompleteHealthContext {
    summary: string;
    profile: {
        age?: string;
        conditions: string[];
        cycleLength: number;
        diet?: string;
        goals?: string;
    };
    documents: Array<{ category: string; summary: string; date: string }>;
    recentTrends?: string;
    lastReport?: string;
}

/**
 * Build complete health context from all available data sources
 */
export async function buildCompleteHealthContext(userId: string): Promise<CompleteHealthContext> {
    // Fetch user profile
    const profile = await getUserProfile(userId);
    
    if (!profile) {
        throw new Error('User profile not found');
    }

    // Start with base context from profile
    const baseContext = buildHealthContext(profile);
    const contextParts: string[] = [baseContext];

    // Fetch medical documents with AI summaries from DynamoDB
    try {
        const docsTable = process.env.DYNAMODB_DOCUMENTS_TABLE || 'ovira-documents';
        const { Items } = await docClient.send(new QueryCommand({
            TableName: docsTable,
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': userId },
        }));
        
        if (Items && Items.length > 0) {
            const includedDocs = Items.filter((d: any) => d.shouldIncludeInSummary && d.aiSummary);
            
            if (includedDocs.length > 0) {
                contextParts.push('\nUploaded Medical Documents:');
                includedDocs.forEach((doc: any) => {
                    const date = new Date(doc.uploadedAt).toLocaleDateString();
                    contextParts.push(`- ${doc.category} (${date}): ${doc.aiSummary}`);
                });
            }
        }
    } catch (err) {
        console.error('Failed to fetch documents:', err);
    }

    // Fetch recent symptom trends (last 30 days) from DynamoDB
    try {
        const symptomsTable = process.env.DYNAMODB_SYMPTOMS_TABLE || 'ovira-symptom-logs';
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        
        const { Items } = await docClient.send(new QueryCommand({
            TableName: symptomsTable,
            KeyConditionExpression: 'userId = :uid AND #date BETWEEN :start AND :end',
            ExpressionAttributeNames: { '#date': 'date' },
            ExpressionAttributeValues: {
                ':uid': userId,
                ':start': thirtyDaysAgo,
                ':end': today,
            },
        }));
        
        if (Items && Items.length > 0) {
            const logs = Items;
            const avgPain = logs.reduce((sum: number, l: any) => sum + (l.painLevel || 0), 0) / logs.length;
            const commonSymptoms = logs
                .flatMap((l: any) => l.symptoms || [])
                .reduce((acc: any, s: string) => {
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {});
            
            const topSymptoms = Object.entries(commonSymptoms)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 3)
                .map(([s]) => s);
            
            contextParts.push('\nRecent 30-day trends:');
            contextParts.push(`- Average pain level: ${avgPain.toFixed(1)}/10`);
            if (topSymptoms.length > 0) {
                contextParts.push(`- Most common symptoms: ${topSymptoms.join(', ')}`);
            }
        }
    } catch (err) {
        console.error('Failed to fetch symptom trends:', err);
    }

    // Build structured context
    const documents = await getDocumentsList(userId);
    
    const completeContext: CompleteHealthContext = {
        summary: contextParts.join('\n'),
        profile: {
            age: profile.ageRange,
            conditions: profile.conditions || [],
            cycleLength: profile.avgCycleLength || 28,
            diet: profile.dietType,
            goals: profile.personalGoal,
        },
        documents,
    };

    return completeContext;
}

async function getDocumentsList(userId: string): Promise<Array<{ category: string; summary: string; date: string }>> {
    try {
        const docsTable = process.env.DYNAMODB_DOCUMENTS_TABLE || 'ovira-documents';
        const { Items } = await docClient.send(new QueryCommand({
            TableName: docsTable,
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': userId },
        }));
        
        if (!Items) return [];
        
        return Items
            .filter((d: any) => d.shouldIncludeInSummary && d.aiSummary)
            .map((d: any) => ({
                category: d.category,
                summary: d.aiSummary,
                date: new Date(d.uploadedAt).toLocaleDateString(),
            }));
    } catch (err) {
        console.error('Failed to get documents list:', err);
        return [];
    }
}

/**
 * Get a plain string summary for AI prompts (backward compatible)
 */
export async function getAIContextString(userId: string): Promise<string> {
    const context = await buildCompleteHealthContext(userId);
    return context.summary;
}

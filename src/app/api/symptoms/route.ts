import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { withRateLimit } from '@/middleware/rateLimit';
import { getUserSymptomLogs } from '@/lib/aws/dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date, flowLevel, painLevel, mood, energyLevel, sleepHours, symptoms, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Normalize date to YYYY-MM-DD to ensure one record per user per date
    const dateObj = new Date(date);
    const normalizedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const id = `${userId}#${normalizedDate}`;

    const command = new PutCommand({
      TableName: process.env.DYNAMODB_SYMPTOMS_TABLE!,
      Item: {
        id, // Primary key — deterministic per user+date for upsert
        userId,
        timestamp: dateObj.getTime(),
        date: normalizedDate,
        flowLevel,
        painLevel,
        mood,
        energyLevel,
        sleepHours,
        symptoms: symptoms || [],
        notes: notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error: any) {
    console.error('Error saving symptom log:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.name || 'SaveError',
        message: error.message || 'Failed to save symptom log',
      },
      { status: 500 }
    );
  }
}

async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use shared function from dynamodb.ts
    const logs = await getUserSymptomLogs(userId, limit);

    return NextResponse.json({
      success: true,
      logs: logs,
    });
  } catch (error: any) {
    console.error('Error fetching symptom logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.name || 'FetchError',
        message: error.message || 'Failed to fetch symptom logs',
      },
      { status: 500 }
    );
  }
}


// Export wrapped handlers with rate limiting
export const POST = withRateLimit(handlePost, 'dynamodb');
export const GET = withRateLimit(handleGet, 'dynamodb');

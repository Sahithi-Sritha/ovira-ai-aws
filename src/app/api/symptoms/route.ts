import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date, flowLevel, painLevel, mood, energyLevel, sleepHours, symptoms, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create unique ID for the log using timestamp
    const timestamp = new Date(date).getTime();
    const id = `${userId}#${timestamp}`;

    const command = new PutCommand({
      TableName: process.env.NEXT_PUBLIC_DYNAMODB_SYMPTOMS_TABLE!,
      Item: {
        id, // Primary key
        userId,
        timestamp,
        date: new Date(date).toISOString(),
        flowLevel,
        painLevel,
        mood,
        energyLevel,
        sleepHours,
        symptoms: symptoms || [],
        notes: notes || null,
        createdAt: new Date().toISOString(),
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

export async function GET(request: NextRequest) {
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

    // Use Scan with filter since we're using simple id key
    const command = new ScanCommand({
      TableName: process.env.NEXT_PUBLIC_DYNAMODB_SYMPTOMS_TABLE!,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Limit: limit,
    });

    const response = await docClient.send(command);

    // Sort by timestamp descending (newest first)
    const sortedLogs = (response.Items || []).sort((a: any, b: any) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      logs: sortedLogs,
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

# DynamoDB Setup Guide

This guide will help you set up the required DynamoDB tables for the Ovira AI application.

## Prerequisites

1. AWS CLI installed and configured with your credentials
2. AWS account with DynamoDB access
3. Correct AWS credentials in `.env.local`

## Quick Setup

### Option 1: Using the Setup Script (Recommended)

**Windows:**
```bash
setup-dynamodb-tables.bat
```

**Linux/Mac:**
```bash
chmod +x setup-dynamodb-tables.sh
./setup-dynamodb-tables.sh
```

### Option 2: Manual Setup via AWS Console

1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/home?region=us-east-1#tables:)
2. Click "Create table" for each table below

#### Table 1: ovira-symptoms
- **Table name**: `ovira-symptoms`
- **Partition key**: `userId` (String)
- **Sort key**: `logId` (String)
- **Table settings**: On-demand (Pay per request)

#### Table 2: ovira-users
- **Table name**: `ovira-users`
- **Partition key**: `uid` (String)
- **Table settings**: On-demand (Pay per request)

#### Table 3: ovira-reports
- **Table name**: `ovira-reports`
- **Partition key**: `userId` (String)
- **Sort key**: `reportId` (String)
- **Table settings**: On-demand (Pay per request)

#### Table 4: ovira-chat-history
- **Table name**: `ovira-chat-history`
- **Partition key**: `userId` (String)
- **Sort key**: `sessionId_timestamp` (String)
- **Table settings**: On-demand (Pay per request)

## Verify Setup

After creating the tables, verify they exist:

```bash
aws dynamodb list-tables --region us-east-1
```

You should see all four tables listed:
- ovira-symptoms
- ovira-users
- ovira-reports
- ovira-chat-history

## Table Structure

### ovira-symptoms
Stores user symptom logs with the following attributes:
- `userId` (String) - Partition key
- `logId` (String) - Sort key (format: `userId#timestamp`)
- `timestamp` (Number) - Unix timestamp
- `date` (String) - ISO date string
- `flowLevel` (String) - none, light, medium, heavy
- `painLevel` (Number) - 0-10
- `mood` (String) - great, good, neutral, bad, terrible
- `energyLevel` (String) - low, medium, high
- `sleepHours` (Number) - Hours of sleep
- `symptoms` (List) - Array of symptom strings
- `notes` (String) - Optional notes
- `createdAt` (String) - ISO timestamp

### ovira-users
Stores user profile information:
- `uid` (String) - Partition key (Cognito user ID)
- `email` (String)
- `displayName` (String)
- `averageCycleLength` (Number)
- `lastPeriodStart` (String) - ISO date
- `language` (String)
- `conditions` (List)
- `createdAt` (String)

### ovira-reports
Stores generated health reports:
- `userId` (String) - Partition key
- `reportId` (String) - Sort key
- `generatedAt` (String)
- `reportData` (Map) - Report content

### ovira-chat-history
Stores chat conversation history:
- `userId` (String) - Partition key
- `sessionId_timestamp` (String) - Sort key
- `message` (String)
- `role` (String) - user or assistant
- `timestamp` (String)

## Troubleshooting

### Error: "ResourceNotFoundException"
The table doesn't exist. Run the setup script or create tables manually.

### Error: "AccessDeniedException"
Your AWS credentials don't have DynamoDB permissions. Check your IAM user/role permissions.

### Error: "ValidationException"
Check that table names in `.env.local` match the actual table names in AWS.

## Cost Information

All tables use **On-Demand (Pay per request)** billing mode:
- No upfront costs
- Pay only for what you use
- Automatically scales with your application
- Typical cost: $1.25 per million write requests, $0.25 per million read requests

For a small application with 1000 users logging daily:
- Estimated monthly cost: $1-5

## Next Steps

After setting up the tables:
1. Restart your Next.js development server
2. Try logging symptoms in the app
3. Check the dashboard to see if data appears
4. Verify data in AWS Console under DynamoDB > Tables > ovira-symptoms > Explore items

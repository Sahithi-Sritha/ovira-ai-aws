import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Result type for all AI invocations — includes metadata about which model responded
export interface InvokeResult {
    response: string;
    model_used: string; // "claude-3-5-haiku" | "nova-lite" | "static-fallback"
    attempts: number;
}

// Simple sleep utility for exponential backoff
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if an error is retryable (throttling or service unavailable)
function isRetryableError(error: any): boolean {
    const retryableNames = ['ThrottlingException', 'ServiceUnavailableException'];
    return (
        retryableNames.includes(error?.name) ||
        retryableNames.includes(error?.__type) ||
        retryableNames.includes(error?.Code)
    );
}

// Bedrock config - defined here (server-side only) to ensure non-NEXT_PUBLIC_ env vars are available.
// These env vars are NOT accessible in 'use client' modules like config.ts.
const bedrockConfig = {
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
    fallbackModelId: process.env.BEDROCK_FALLBACK_MODEL_ID || 'amazon.nova-lite-v1:0',
    region: process.env.BEDROCK_REGION || 'us-east-1',
};

// Server-side only - Initialize Bedrock client
function getBedrockClient(): BedrockRuntimeClient {
    return new BedrockRuntimeClient({
        region: bedrockConfig.region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
    });
}

// Medical safety guardrails - prohibited words and phrases
const PROHIBITED_MEDICAL_TERMS = [
    'diagnose', 'diagnosis', 'treatment', 'cure', 'prescribe', 'prescription',
    'disease', 'disorder', 'illness', 'medication', 'medicine', 'drug',
];

// Check if response contains prohibited medical terms
function containsProhibitedTerms(text: string): boolean {
    const lowerText = text.toLowerCase();
    return PROHIBITED_MEDICAL_TERMS.some(term => lowerText.includes(term));
}

// Sanitize AI response — strip prohibited terms, no disclaimer footer
export function sanitizeResponse(text: string): string {
    if (containsProhibitedTerms(text)) {
        console.warn('[MEDICAL TERM FLAGGED] Response contains prohibited medical terms:', {
            timestamp: new Date().toISOString(),
            flaggedTerms: PROHIBITED_MEDICAL_TERMS.filter(term =>
                text.toLowerCase().includes(term)
            ),
            responsePreview: text.substring(0, 200) + '...',
        });
    }
    // Return clean — no disclaimer appended here
    return text;
}

// Detect if we're using a Claude or Nova/Titan model
function isClaudeModel(modelId: string): boolean {
    return modelId.includes('anthropic') || modelId.includes('claude');
}

// Invoke the configured model (Claude or Nova) via Bedrock
export async function invokeClaude(
    prompt: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
    const client = getBedrockClient();
    const modelId = bedrockConfig.modelId;

    try {
        let requestBody: object;
        let text = '';

        if (isClaudeModel(modelId)) {
            // ── Claude (Anthropic) format ────────────────────────────────────
            const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
            if (conversationHistory) messages.push(...conversationHistory);
            messages.push({ role: 'user', content: prompt });

            requestBody = {
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 1024,
                temperature: 0.7,
                system: systemPrompt || 'You are Aria, a warm and caring friend who helps with women\'s health questions. Speak naturally and conversationally. Provide educational information only, never diagnose or prescribe.',
                messages,
            };

            const command = new InvokeModelCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody),
            });

            const response = await client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            text = responseBody.content?.[0]?.text || '';

        } else {
            // ── Amazon Nova / Titan format ───────────────────────────────────
            const novaMessages = [];
            if (conversationHistory) {
                for (const msg of conversationHistory) {
                    novaMessages.push({ role: msg.role, content: [{ text: msg.content }] });
                }
            }
            novaMessages.push({ role: 'user', content: [{ text: prompt }] });

            requestBody = {
                messages: novaMessages,
                system: systemPrompt
                    ? [{ text: systemPrompt }]
                    : [{ text: 'You are Aria, a warm and caring friend who helps with women\'s health questions. Speak naturally and conversationally, like you\'re talking to a friend. Provide educational information only, never diagnose or prescribe. Be empathetic, supportive, and use everyday language.' }],
                inferenceConfig: {
                    maxTokens: 1024,
                    temperature: 0.8,
                    topP: 0.9,
                },
            };

            const command = new InvokeModelCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody),
            });

            const response = await client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            text = responseBody.output?.message?.content?.[0]?.text || '';
        }

        // Apply medical safety guardrails
        if (containsProhibitedTerms(text)) {
            console.warn('Response contained prohibited medical terms, sanitizing...');
            return sanitizeResponse(text);
        }

        return text;
    } catch (error) {
        console.error('Model invocation error:', error);
        throw error;
    }
}


// Invoke Nova Micro model as fallback
export async function invokeTitan(prompt: string): Promise<string> {
    const client = getBedrockClient();

    const requestBody = {
        messages: [
            {
                role: 'user',
                content: [{ text: prompt }],
            },
        ],
        inferenceConfig: {
            maxTokens: 1024,
            temperature: 0.7,
            topP: 0.9,
        },
    };

    try {
        const command = new InvokeModelCommand({
            modelId: bedrockConfig.fallbackModelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(requestBody),
        });

        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        const text = responseBody.output?.message?.content?.[0]?.text || '';

        // Apply medical safety guardrails
        if (containsProhibitedTerms(text)) {
            console.warn('Response contained prohibited medical terms, sanitizing...');
            return sanitizeResponse(text);
        }

        return text;
    } catch (error) {
        console.error('Titan invocation error:', error);
        throw error;
    }
}

// Core retry wrapper with exponential backoff and fallback chain
export async function invokeWithRetry(
    fn: () => Promise<string>,
    fallbackMessage: string,
    maxAttempts: number = 3
): Promise<InvokeResult> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`[${new Date().toISOString()}] Attempt ${attempt}/${maxAttempts} — invoking Claude...`);
            const response = await fn();
            console.log(`[${new Date().toISOString()}] Claude succeeded on attempt ${attempt}`);
            return { response, model_used: 'claude-3-haiku', attempts: attempt };
        } catch (error: any) {
            lastError = error;
            console.error(`[${new Date().toISOString()}] Attempt ${attempt} failed:`, error?.name || error?.message);

            if (!isRetryableError(error)) {
                console.log(`[${new Date().toISOString()}] Non-retryable error, skipping to fallback chain`);
                break;
            }

            if (attempt < maxAttempts) {
                const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
                console.log(`[${new Date().toISOString()}] Retryable error, waiting ${backoffMs}ms before retry...`);
                await sleep(backoffMs);
            }
        }
    }

    // Fallback 1: Try Nova Lite
    try {
        console.log(`[${new Date().toISOString()}] Claude exhausted, trying Nova Lite fallback...`);
        const fullPrompt = fallbackMessage;
        const response = await invokeTitan(fullPrompt);
        console.log(`[${new Date().toISOString()}] Nova Lite fallback succeeded`);
        return { response, model_used: 'nova-lite', attempts: maxAttempts };
    } catch (titanError: any) {
        console.error(`[${new Date().toISOString()}] Nova Lite also failed:`, titanError?.name || titanError?.message);
    }

    // Fallback 2: Keyword-based static response
    console.log(`[${new Date().toISOString()}] All AI models failed, returning static fallback response`);
    const staticResponse = getFallbackResponse(fallbackMessage);
    return { response: staticResponse, model_used: 'static-fallback', attempts: maxAttempts };
}

// Main function to invoke AI with retry + fallback
export async function invokeAI(
    prompt: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<InvokeResult> {
    const fn = () => invokeClaude(prompt, systemPrompt, conversationHistory);
    const fallbackPrompt = systemPrompt
        ? `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`
        : prompt;
    return invokeWithRetry(fn, fallbackPrompt);
}

// Generate health report summary using AI
export async function generateHealthReportSummary(
    symptomData: string,
    userContext: string
): Promise<InvokeResult> {
    const systemPrompt = `You are a medical data analyst AI. Generate a comprehensive, doctor-friendly health report based on symptom logs.

CRITICAL RULES:
1. Provide ONLY non-diagnostic statistical analysis
2. Use decision-support language, NOT diagnostic language
3. Encourage professional medical consultation
4. Return valid JSON only
5. Never use words: diagnose, treatment, cure, disease, prescribe

Return JSON with this structure:
{
    "executiveSummary": "Professional summary for healthcare providers (non-diagnostic)",
    "cycleInsights": {
        "overallPattern": "Description",
        "averagePainLevel": 0.0,
        "flowPatternDescription": "Description",
        "cycleRegularity": "regular|irregular|insufficient_data"
    },
    "symptomAnalysis": {
        "mostFrequentSymptoms": [{"symptom": "name", "count": 0, "percentage": 0}],
        "painTrend": "increasing|decreasing|stable|variable",
        "moodPattern": "Description",
        "sleepQuality": "Description",
        "energyPattern": "Description",
        "notableCorrelations": ["correlation 1"]
    },
    "riskAssessment": [
        {
            "condition": "Statistical indicator name",
            "riskLevel": "low|medium|high",
            "confidence": "low|medium|high",
            "indicators": ["indicator 1"],
            "recommendation": "Consult healthcare provider about..."
        }
    ],
    "recommendations": ["Recommendation 1"],
    "questionsForDoctor": ["Question 1"],
    "lifestyleTips": ["Tip 1"],
    "urgentFlags": []
}`;

    const prompt = `${userContext}\n\n${symptomData}\n\nGenerate a comprehensive health report following the JSON structure. Focus on statistical patterns and decision-support insights.`;

    try {
        const result = await invokeAI(prompt, systemPrompt);
        return result;
    } catch (error) {
        console.error('Health report generation error:', error);
        throw error;
    }
}

// Chat with AI assistant
export async function chatWithAI(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userContext?: string
): Promise<InvokeResult> {
    const systemPrompt = `You are Aria, a warm and understanding friend who specializes in women's health. Think of yourself as a knowledgeable companion who truly cares about helping women understand their bodies and menstrual health.

${userContext ? `About this person:
${userContext}

Use this to personalize your responses naturally. For example:
- If she mentions PCOS and a rice-heavy diet, you might say: "Since you have PCOS and eat a lot of rice, you might find it helpful to know that rice can affect iron absorption. Try adding some vitamin C-rich foods to your meals - it really helps!"
- If she's vegetarian, never suggest non-vegetarian options
- If she's tracking irregular cycles, keep your focus on cycle patterns and what might help

` : ''}Your personality:
- Speak naturally and conversationally, like a caring friend would
- Be empathetic and understanding - periods and women's health can be sensitive topics
- Use everyday language, not medical jargon
- Show genuine warmth and support in your responses
- Keep responses concise but friendly (2-3 short paragraphs)

Important guidelines:
1. NEVER use clinical terms like: diagnose, diagnosis, treatment, cure, prescribe, disease, disorder, illness, medication, medicine, drug, prescription
2. Instead, use friendly alternatives: "what you're experiencing", "ways to manage", "things that might help", "patterns I'm noticing"
3. Always end with: "Please consult a healthcare provider for personalised advice."
4. Be conversational and natural - avoid sounding robotic or overly formal

Remember: You're a supportive friend, not a medical professional. Your goal is to educate, support, and empower.`;

    return invokeAI(message, systemPrompt, conversationHistory);
}

// Fallback responses when AI is unavailable
export const FALLBACK_RESPONSES: Record<string, string> = {
    default: "I'm here to provide educational information about women's health. While I'm having trouble connecting right now, I encourage you to track your symptoms regularly and consult with a healthcare provider for personalized advice. Is there something specific you'd like to know about?",
    pain: "Period pain is common, but if it's severe or affecting your daily life, please consult a healthcare provider. General tips: apply heat, stay hydrated, gentle exercise may help. This is educational information only - not medical advice.",
    mood: "Mood changes during your cycle are normal due to hormonal fluctuations. Self-care strategies like regular sleep and exercise can help. If mood changes are severe, consider speaking with a healthcare provider. This is decision-support information only.",
    cycle: "A typical menstrual cycle lasts 21-35 days. If your cycle is irregular or you're experiencing unusual symptoms, discuss with your doctor. This is educational information to support your healthcare decisions.",
};

export function getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('pain') || lowerMessage.includes('cramp')) {
        return FALLBACK_RESPONSES.pain;
    }
    if (lowerMessage.includes('mood') || lowerMessage.includes('feel')) {
        return FALLBACK_RESPONSES.mood;
    }
    if (lowerMessage.includes('cycle') || lowerMessage.includes('period')) {
        return FALLBACK_RESPONSES.cycle;
    }
    return FALLBACK_RESPONSES.default;
}

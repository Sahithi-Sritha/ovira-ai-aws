import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI, getFallbackResponse, sanitizeResponse } from '@/lib/aws/bedrock';
import { retrieveAndGenerate, type Citation } from '@/lib/aws/bedrock-kb';
import { retryWithBackoff } from '@/lib/aws/bedrock-kb';

// ─── Constants ───────────────────────────────────────────────────────────────

const CHATBOT_KB_ID = process.env.BEDROCK_CHATBOT_KB_ID || '';

const CHATBOT_SYSTEM_PROMPT = `You are Aria, an empathetic women's health companion for Ovira AI.
You help users understand their menstrual health using trusted health information.

STRICT RULES — never break these:
1. NEVER use these words: diagnose, diagnosis, treatment, cure, prescribe, disease,
   disorder, illness, medication, medicine, drug, prescription
2. ALWAYS end with: "Please consult a healthcare provider for personalised advice."
3. Use warm, supportive, non-medical language
4. When citing sources, say "According to the Office on Women's Health..." or
   "The WHO explains that..."
5. Keep answers to 2–3 paragraphs maximum
6. If the question is outside women's menstrual health, politely redirect

The search results from our trusted health library are below:
$search_results$`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a context-enriched question by prepending the last 3 conversation
 * history messages so the KB model has conversational context.
 */
function buildContextualQuestion(
    userMessage: string,
    history?: Array<{ role: string; content: string }>,
): string {
    if (!history || history.length === 0) {
        return userMessage;
    }

    const recentContext = history
        .slice(-3)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

    return `${recentContext}\n\nUser: ${userMessage}`;
}

/**
 * Format citation sources into a readable footer string.
 */
function formatCitationFooter(citations: Citation[]): string {
    if (citations.length === 0) return '';

    const sourceNames = citations
        .map((c) => c.source)
        .filter((s) => s !== 'Unknown source')
        // Deduplicate
        .filter((s, i, arr) => arr.indexOf(s) === i)
        // Extract readable name from S3 URIs or use as-is
        .map((s) => {
            if (s.startsWith('s3://')) {
                const filename = s.split('/').pop() || s;
                return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            }
            return s;
        });

    if (sourceNames.length === 0) return '';

    return `\n\n📚 Sources: ${sourceNames.join(', ')}`;
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const { message, history, userContext } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 },
            );
        }

        // Check if AWS credentials are configured
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.log('AWS credentials not configured, using fallback response');
            return NextResponse.json({
                message: getFallbackResponse(message),
                citations: [],
                model: 'static-fallback',
                ragEnabled: false,
            });
        }

        // Build conversation history array
        const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        if (history && Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
                conversationHistory.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                });
            }
        }

        // ── Attempt KB-backed RAG response ──────────────────────────────────

        if (CHATBOT_KB_ID) {
            try {
                const contextualQuestion = buildContextualQuestion(message, history);

                const { answer, citations, modelUsed } = await retryWithBackoff(() =>
                    retrieveAndGenerate(
                        contextualQuestion,
                        CHATBOT_KB_ID,
                        CHATBOT_SYSTEM_PROMPT,
                    ),
                );

                // Apply medical safety guardrails
                const sanitizedAnswer = sanitizeResponse(answer);

                // Append citation footer if sources exist
                const citationFooter = formatCitationFooter(citations);
                const finalMessage = sanitizedAnswer + citationFooter;

                return NextResponse.json({
                    message: finalMessage,
                    citations,
                    model: modelUsed,
                    ragEnabled: true,
                });
            } catch (kbError) {
                console.error(
                    'KB call failed after retries, falling back to direct Claude:',
                    kbError,
                );
                // Fall through to chatWithAI fallback below
            }
        } else {
            console.warn('BEDROCK_CHATBOT_KB_ID not set — skipping KB, using direct Claude');
        }

        // ── Fallback: direct chatWithAI (no RAG) ───────────────────────────

        try {
            // Build user context string
            let contextString = '';
            if (userContext?.healthSummary) {
                contextString = userContext.healthSummary;
            } else {
                if (userContext?.ageRange) {
                    contextString += `User age range: ${userContext.ageRange}`;
                }
                if (userContext?.conditions?.length > 0) {
                    contextString += `, Known conditions: ${userContext.conditions.join(', ')}`;
                }
            }

            const { response, model_used } = await chatWithAI(
                message,
                conversationHistory,
                contextString,
            );

            return NextResponse.json({
                message: response,
                citations: [],
                model: model_used,
                ragEnabled: false,
            });
        } catch (fallbackError) {
            console.error('Direct Claude fallback also failed:', fallbackError);
        }

        // ── Final static fallback ───────────────────────────────────────────

        return NextResponse.json({
            message: getFallbackResponse(message),
            citations: [],
            model: 'static-fallback',
            ragEnabled: false,
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json({
            message: getFallbackResponse(''),
            citations: [],
            model: 'static-fallback',
            ragEnabled: false,
        });
    }
}

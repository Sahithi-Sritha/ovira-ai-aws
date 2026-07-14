import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI, getFallbackResponse, sanitizeResponse } from '@/lib/aws/bedrock';
import { chatWithKB, type Citation } from '@/lib/aws/bedrock-kb';
import { chatWithSLM, routeToSLM } from '@/lib/menstllama-client';
import { withRateLimit } from '@/middleware/rateLimit';
import { getAIContextString } from '@/lib/buildCompleteContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Topics outside women's / menstrual health that Aria should decline
const OFF_TOPIC_PATTERNS = [
    /\b(math|maths|mathematics|calculus|algebra|geometry|statistics)\b/i,
    /\b(physics|chemistry|biology|science)\b/i,
    /\b(history|geography|politics|economics|finance|invest)\b/i,
    /\b(sport|cricket|football|soccer|tennis|basketball)\b/i,
    /\b(recipe|cook|food)\b(?!.*(period|cycle|cramp|iron|nutrition|hormone))/i,
    /\b(code|programming|javascript|python|css|html)\b/i,
    /\b(weather|news|current events)\b/i,
    /\b(movie|film|music|song|celebrity|actor)\b/i,
    /\b(\d+\s*[+\-*/]\s*\d+|\bsolve\b|\bcalculate\b|\bequation\b)/i,
];

const OFF_TOPIC_REPLY =
    "I'm Aria, and I'm here specifically to help with women's health and menstrual wellness questions. I'm not able to help with that topic — please feel free to ask me anything about your cycle, symptoms, or reproductive health.";

function isOffTopic(message: string): boolean {
    return OFF_TOPIC_PATTERNS.some(p => p.test(message));
}

/**
 * Strip raw RAG citation headers from the final response text.
 * These look like: [1] (Source: chatbot-health. 000) ...
 */
function stripCitationHeaders(text: string): string {
    // Remove numbered source blocks: [N] (Source: ...) followed by content
    return text
        .replace(/\[\d+\]\s*\(Source:[^)]+\)[^\n]*/g, '')
        .replace(/📚\s*Sources?:[^\n]*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// ─── Route Handler ───────────────────────────────────────────────────────────

async function handlePost(request: NextRequest) {
    try {
        const { message, history, userId } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 },
            );
        }

        // ── Topic guard: decline non-health questions immediately ───────────
        if (isOffTopic(message)) {
            return NextResponse.json({
                message: OFF_TOPIC_REPLY,
                citations: [],
                model: 'topic-guard',
                ragEnabled: false,
                slmUsed: false,
            });
        }

        // Build complete health context from all data sources
        let contextString = '';
        if (userId) {
            try {
                contextString = await getAIContextString(userId);
                console.log('[Chat API] Built complete context for user:', userId);
            } catch (err) {
                console.error('[Chat API] Failed to build complete context:', err);
                // Fall back to basic context if available
                contextString = '';
            }
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

        // ── Step 1: Classify — should this go to the SLM? ──────────────────

        const useSLM = routeToSLM(message);

        // ── Step 2: If SLM route, try MenstLLaMA first ─────────────────────

        if (useSLM) {
            try {
                const slmResult = await chatWithSLM(message, contextString);

                if (!slmResult.fallbackUsed) {
                    // SLM succeeded — apply safety guardrails and return
                    const sanitized = sanitizeResponse(slmResult.response);

                    return NextResponse.json({
                        message: stripCitationHeaders(sanitized),
                        citations: [],
                        model: 'MenstLLaMA-EC2 (Menstrual Health Specialist)',
                        ragEnabled: false,
                        slmUsed: true,
                        latency_ms: slmResult.latency_ms,
                    });
                }

                // SLM unavailable — fall through to Bedrock below
                console.log('SLM unavailable or returned fallback, falling through to Bedrock');
            } catch (slmError) {
                console.error('SLM call threw, falling through to Bedrock:', slmError);
            }
        }

        // ── Step 3: Check if AWS credentials are configured ────────────────

        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.log('AWS credentials not configured, using fallback response');
            return NextResponse.json({
                message: getFallbackResponse(message),
                citations: [],
                model: 'static-fallback',
                ragEnabled: false,
                slmUsed: false,
            });
        }

        // ── Step 4: Local RAG-backed response (Manual RAG via bedrock-kb) ──

        try {
            const kbResult = await chatWithKB(
                message,
                conversationHistory,
                contextString || undefined,
            );

            // Apply medical safety guardrails
            const sanitizedAnswer = sanitizeResponse(kbResult.response);

            return NextResponse.json({
                message: stripCitationHeaders(sanitizedAnswer),
                citations: [],
                model: kbResult.modelUsed,
                ragEnabled: !kbResult.fallbackUsed,
                slmUsed: false,
            });
        } catch (ragError) {
            console.error(
                'Local RAG call failed, falling back to direct Claude:',
                ragError,
            );
            // Fall through to chatWithAI fallback below
        }

        // ── Step 5: Fallback — direct chatWithAI (no RAG) ──────────────────

        try {
            const { response, model_used } = await chatWithAI(
                message,
                conversationHistory,
                contextString,
            );

            return NextResponse.json({
                message: stripCitationHeaders(response),
                citations: [],
                model: model_used,
                ragEnabled: false,
                slmUsed: false,
            });
        } catch (fallbackError) {
            console.error('Direct Claude fallback also failed:', fallbackError);
        }

        // ── Step 6: Final static fallback ──────────────────────────────────

        return NextResponse.json({
            message: getFallbackResponse(message),
            citations: [],
            model: 'static-fallback',
            ragEnabled: false,
            slmUsed: false,
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json({
            message: getFallbackResponse(''),
            citations: [],
            model: 'static-fallback',
            ragEnabled: false,
            slmUsed: false,
        });
    }
}


// Export wrapped handler with rate limiting
export const POST = withRateLimit(handlePost, 'bedrock');

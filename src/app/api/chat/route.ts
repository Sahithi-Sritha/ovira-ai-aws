import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Ovira AI, a compassionate and knowledgeable women's health assistant. Your role is to provide supportive, educational information about women's health topics including menstrual health, reproductive wellness, and general well-being.

IMPORTANT GUIDELINES:
1. Be empathetic, warm, and use stigma-free language
2. NEVER prescribe medications or provide medical diagnoses
3. ALWAYS recommend consulting healthcare professionals for medical concerns
4. Provide educational information based on established medical knowledge
5. Address sensitive topics with care, respect, and without judgment
6. If asked about emergencies or severe symptoms, immediately advise seeking medical care
7. Keep responses concise but informative (2-3 paragraphs max)
8. Use simple, accessible language

TOPICS YOU CAN HELP WITH:
- Menstrual cycle tracking and understanding
- PMS and period symptoms
- General reproductive health education
- Lifestyle tips for menstrual wellness
- When to see a doctor
- Emotional support and validation

TOPICS TO REDIRECT TO DOCTORS:
- Specific medical diagnoses
- Medication recommendations
- Severe pain or unusual symptoms
- Pregnancy-related medical advice
- Fertility treatments

Remember: You are a supportive companion, not a replacement for medical care.`;

// Fallback responses for when AI is not available
const FALLBACK_RESPONSES: Record<string, string> = {
    default: "I'm here to help with women's health questions. While I'm having trouble connecting to my AI service right now, I can tell you that it's always a good idea to track your symptoms regularly and consult with a healthcare provider for personalized advice. Is there something specific you'd like to know about?",
    pain: "Period pain is very common, but if it's severe or affecting your daily life, please consult a healthcare provider. Some general tips: apply heat to your lower abdomen, stay hydrated, gentle exercise can help, and over-the-counter pain relievers may provide relief. Always follow the dosage instructions.",
    mood: "Mood changes during your cycle are normal due to hormonal fluctuations. Self-care strategies like regular sleep, exercise, and stress management can help. If mood changes are severe or impacting your life significantly, consider speaking with a healthcare provider about PMDD.",
    cycle: "A typical menstrual cycle lasts 21-35 days, with bleeding lasting 2-7 days. If your cycle is irregular, very heavy, or you're experiencing unusual symptoms, it's worth discussing with your doctor.",
};

function getFallbackResponse(message: string): string {
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

export async function POST(request: NextRequest) {
    try {
        const { message, history, userContext } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.log('No GEMINI_API_KEY found, using fallback response');
            return NextResponse.json({
                message: getFallbackResponse(message),
            });
        }

        // Clean the API key (remove any whitespace or quotes)
        const cleanApiKey = apiKey.trim().replace(/['"]/g, '');
        console.log('API key configured:', cleanApiKey.length >= 30 ? 'valid length' : 'too short');

        // Build the conversation for the API
        let contextualPrompt = SYSTEM_PROMPT;
        if (userContext?.ageRange) {
            contextualPrompt += `\n\nUser context: Age range ${userContext.ageRange}`;
        }
        if (userContext?.conditions?.length > 0) {
            contextualPrompt += `, known conditions: ${userContext.conditions.join(', ')}`;
        }

        // Build message history
        const contents = [
            {
                role: 'user',
                parts: [{ text: 'You are Ovira AI. Please follow these instructions: ' + contextualPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: 'I understand. I am Ovira AI, a compassionate women\'s health assistant. How can I help you today?' }]
            }
        ];

        // Add conversation history
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            }
        }

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Try multiple model names
        const modelNames = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro'];
        let lastError: any = null;

        for (const modelName of modelNames) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanApiKey}`;

                console.log(`Trying model: ${modelName}`);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: contents,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1024,
                        },
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error(`Model ${modelName} failed:`, data);
                    lastError = data;
                    continue; // Try next model
                }

                // Success! Extract the response
                const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (aiMessage) {
                    console.log(`Success with model: ${modelName}`);
                    return NextResponse.json({ message: aiMessage });
                } else {
                    console.error('No text in response:', data);
                    lastError = data;
                }
            } catch (modelError) {
                console.error(`Error with model ${modelName}:`, modelError);
                lastError = modelError;
            }
        }

        // All models failed - log the last error and return fallback
        console.error('All models failed. Last error:', lastError);
        return NextResponse.json({
            message: getFallbackResponse(message),
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json({
            message: getFallbackResponse(''),
        });
    }
}

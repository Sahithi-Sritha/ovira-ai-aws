import { NextRequest, NextResponse } from 'next/server';
import { buildCompleteHealthContext } from '@/lib/buildCompleteContext';

/**
 * GET /api/context?userId=xxx
 * 
 * Returns complete health context for AI and UI display
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId required' },
                { status: 400 }
            );
        }

        const context = await buildCompleteHealthContext(userId);

        return NextResponse.json({
            success: true,
            context,
        });
    } catch (error: any) {
        console.error('Error building health context:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to build context',
            },
            { status: 500 }
        );
    }
}

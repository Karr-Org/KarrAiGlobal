/**
 * KARR AI - Presentation Feedback API
 * 
 * POST /api/presentations/feedback - Record rating, download, view, discard
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    recordRating,
    recordDownload,
    recordView,
    recordDiscard,
    recordEdit
} from '@/lib/presentation/feedback';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, presentationId, userId, ...data } = body;

        if (!action || !presentationId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields: action, presentationId, userId' },
                { status: 400 }
            );
        }

        let success = false;

        switch (action) {
            case 'rate':
                if (!data.rating || data.rating < 1 || data.rating > 5) {
                    return NextResponse.json(
                        { error: 'Rating must be between 1 and 5' },
                        { status: 400 }
                    );
                }
                success = await recordRating(presentationId, userId, data.rating, data.feedback);
                break;

            case 'download':
                if (!data.format || !['pptx', 'pdf'].includes(data.format)) {
                    return NextResponse.json(
                        { error: 'Format must be pptx or pdf' },
                        { status: 400 }
                    );
                }
                success = await recordDownload(presentationId, userId, data.format);
                break;

            case 'view':
                success = await recordView(presentationId, userId, data.durationSeconds || 0);
                break;

            case 'discard':
                success = await recordDiscard(presentationId, userId);
                break;

            case 'edit':
                if (!data.editType) {
                    return NextResponse.json(
                        { error: 'Edit type is required' },
                        { status: 400 }
                    );
                }
                success = await recordEdit({
                    presentationId,
                    userId,
                    editType: data.editType,
                    slideIndex: data.slideIndex,
                    beforeValue: data.beforeValue,
                    afterValue: data.afterValue,
                    editReason: data.editReason
                });
                break;

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success });

    } catch (error) {
        console.error('[API] Feedback error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

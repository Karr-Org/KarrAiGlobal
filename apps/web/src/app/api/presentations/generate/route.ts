/**
 * KARR AI - Presentation Generation API
 * 
 * POST /api/presentations/generate
 * Generates a new AI presentation using SlideJSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePresentation } from '@/lib/presentation/generator';
import { PresentationRequest } from '@/lib/presentation/types';

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();
        const {
            productId,
            userId,
            chatSessionId,
            topic,
            audience,
            goal,
            slideCount,
            style,
            knowledgeContext
        } = body;

        // Validate required fields
        if (!productId || !userId || !topic) {
            return NextResponse.json(
                { error: 'Missing required fields: productId, userId, topic' },
                { status: 400 }
            );
        }

        console.log(`[API] Generating presentation for topic: "${topic}"`);

        // Build request
        const presRequest: PresentationRequest = {
            productId,
            userId,
            chatSessionId,
            topic,
            audience,
            goal,
            slideCount: slideCount || 8,
            style: style || 'professional',
            knowledgeContext
        };

        // Generate presentation
        const result = await generatePresentation(presRequest);

        if (!result.success || !result.presentation) {
            return NextResponse.json(
                { error: result.error || 'Failed to generate presentation' },
                { status: 500 }
            );
        }

        // Save to database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            const { data: savedPres, error: saveError } = await supabase
                .from('presentations')
                .insert({
                    id: result.presentation.id,
                    product_id: productId,
                    user_id: userId,
                    chat_session_id: chatSessionId,
                    title: result.presentation.title,
                    topic: result.presentation.topic,
                    audience: result.presentation.audience,
                    goal: result.presentation.goal,
                    slide_json: result.presentation,
                    markdown_content: result.markdown,
                    slide_count: result.presentation.slideCount,
                    design_tokens: result.presentation.designTokens,
                    quality_score_overall: result.qualityScores?.overall,
                    quality_score_content: result.qualityScores?.content,
                    quality_score_design: result.qualityScores?.design,
                    quality_score_narrative: result.qualityScores?.narrative,
                    quality_score_accessibility: result.qualityScores?.accessibility,
                    status: 'generated'
                })
                .select()
                .single();

            if (saveError) {
                console.error('[API] Error saving presentation:', saveError);
                // Continue anyway - return the generated content
            } else {
                console.log('[API] Saved presentation:', savedPres?.id);
            }
        }

        return NextResponse.json({
            success: true,
            presentation: result.presentation,
            markdown: result.markdown,
            qualityScores: result.qualityScores
        });

    } catch (error) {
        console.error('[API] Presentation generation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

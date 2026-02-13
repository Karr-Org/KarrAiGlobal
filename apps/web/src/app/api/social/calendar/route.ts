import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/social/calendar
 * 
 * Fetches the content calendar for a user OR product.
 * Unified: same logic, same output shape, regardless of owner type.
 * 
 * Query params:
 *   - ownerType: 'user' | 'product'
 *   - ownerId: UUID of the user or product
 *   - weeks: number of weeks to show (default: 4)
 *   - startDate: ISO date string for calendar start
 */
export async function GET(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const ownerType = searchParams.get('ownerType') || 'user';
        const ownerId = searchParams.get('ownerId') || userId;
        const weeks = parseInt(searchParams.get('weeks') || '4');
        const startDateStr = searchParams.get('startDate');

        // Calculate date range
        const startDate = startDateStr ? new Date(startDateStr) : getWeekStart(new Date());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (weeks * 7));

        // Build query based on owner type
        let query = supabase
            .from('social_posts')
            .select('*')
            .gte('scheduled_at', startDate.toISOString())
            .lte('scheduled_at', endDate.toISOString())
            .in('status', ['scheduled', 'published', 'draft'])
            .order('scheduled_at', { ascending: true });

        if (ownerType === 'product') {
            query = query.eq('product_id', ownerId);
        } else {
            query = query.eq('user_id', ownerId).is('product_id', null);
        }

        const { data: posts, error } = await query;
        if (error) throw error;

        // Fetch content patterns for optimal time suggestions
        let patternsQuery = supabase
            .from('content_patterns')
            .select('*')
            .eq('pattern_type', 'time')
            .order('avg_engagement_rate', { ascending: false })
            .limit(10);

        if (ownerType === 'product') {
            patternsQuery = patternsQuery.eq('product_id', ownerId);
        } else {
            patternsQuery = patternsQuery.eq('user_id', ownerId).is('product_id', null);
        }

        const { data: timePatterns } = await patternsQuery;

        // Build calendar structure
        const calendar = buildCalendar(
            startDate,
            weeks,
            posts || [],
            timePatterns || [],
            { type: ownerType as 'user' | 'product', ownerId }
        );

        return NextResponse.json(calendar);
    } catch (e: any) {
        console.error('[Calendar API] Error:', e);
        return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
    }
}

/**
 * POST /api/social/calendar
 * 
 * Performs calendar actions:
 *   - fill_slots: AI generates content for empty optimal time slots
 *   - reschedule: Move a post to a different time slot
 *   - bulk_schedule: Schedule multiple drafts at optimal times
 */
export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, ownerType, ownerId } = body;

        switch (action) {
            case 'fill_slots': {
                const { slotCount = 5, platforms = ['linkedin', 'twitter'], contentStrategy } = body;

                // Get optimal posting times from patterns
                let patternsQuery = supabase
                    .from('content_patterns')
                    .select('pattern_key, avg_engagement_rate')
                    .eq('pattern_type', 'time')
                    .order('avg_engagement_rate', { ascending: false })
                    .limit(slotCount);

                if (ownerType === 'product') {
                    patternsQuery = patternsQuery.eq('product_id', ownerId);
                } else {
                    patternsQuery = patternsQuery.eq('user_id', ownerId);
                }

                const { data: patterns } = await patternsQuery;

                // Generate suggested time slots (fallback to common optimal times)
                const slots = patterns?.length
                    ? patterns.map(p => parseTimePattern(p.pattern_key))
                    : getDefaultOptimalSlots(slotCount);

                // Create draft posts for each slot
                const posts = [];
                for (let i = 0; i < Math.min(slotCount, slots.length); i++) {
                    const slot = slots[i];
                    const platform = platforms[i % platforms.length];

                    const insertData: Record<string, unknown> = {
                        user_id: userId,
                        platform,
                        content: `[AI-suggested content for ${slot.label}]`,
                        status: 'draft',
                        scheduled_at: slot.date.toISOString(),
                        source_type: 'ai_calendar_suggestion',
                        ai_draft_variant: 'calendar_fill',
                        calendar_week: getISOWeek(slot.date),
                        calendar_day_of_week: slot.date.getDay(),
                        calendar_hour: slot.date.getHours(),
                        calendar_slot: slot.label,
                    };

                    if (ownerType === 'product') {
                        insertData.product_id = ownerId;
                    }

                    const { data: post, error } = await supabase
                        .from('social_posts')
                        .insert(insertData)
                        .select()
                        .single();

                    if (post) posts.push(post);
                }

                return NextResponse.json({ posts, filled: posts.length });
            }

            case 'reschedule': {
                const { postId, newScheduledAt } = body;
                const newDate = new Date(newScheduledAt);

                const { data: post, error } = await supabase
                    .from('social_posts')
                    .update({
                        scheduled_at: newDate.toISOString(),
                        calendar_week: getISOWeek(newDate),
                        calendar_day_of_week: newDate.getDay(),
                        calendar_hour: newDate.getHours(),
                    })
                    .eq('id', postId)
                    .select()
                    .single();

                if (error) throw error;
                return NextResponse.json({ post });
            }

            case 'bulk_schedule': {
                const { postIds, startFrom } = body;
                // Auto-schedule posts at optimal times starting from startFrom
                const scheduledPosts = [];
                const baseDate = startFrom ? new Date(startFrom) : new Date();

                for (let i = 0; i < postIds.length; i++) {
                    const scheduledAt = new Date(baseDate);
                    scheduledAt.setDate(scheduledAt.getDate() + Math.floor(i / 2)); // 2 posts per day
                    scheduledAt.setHours(i % 2 === 0 ? 9 : 17, 0, 0, 0); // 9am and 5pm

                    const { data: post } = await supabase
                        .from('social_posts')
                        .update({
                            status: 'scheduled',
                            scheduled_at: scheduledAt.toISOString(),
                            calendar_week: getISOWeek(scheduledAt),
                            calendar_day_of_week: scheduledAt.getDay(),
                            calendar_hour: scheduledAt.getHours(),
                        })
                        .eq('id', postIds[i])
                        .select()
                        .single();

                    if (post) scheduledPosts.push(post);
                }

                return NextResponse.json({ posts: scheduledPosts, scheduled: scheduledPosts.length });
            }

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (e: any) {
        console.error('[Calendar API] Error:', e);
        return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
    }
}

// ============================================
// HELPERS
// ============================================

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    // Monday as first day of week
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
}

function getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function buildCalendar(
    startDate: Date,
    weeks: number,
    posts: any[],
    timePatterns: any[],
    owner: { type: string; ownerId: string }
) {
    const calendarWeeks = [];
    const platformDist: Record<string, number> = {};

    for (let w = 0; w < weeks; w++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (w * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekPosts = posts.filter(p => {
            const d = new Date(p.scheduled_at);
            return d >= weekStart && d <= weekEnd;
        });

        const entries = [];
        for (let d = 0; d < 7; d++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + d);

            // Check for posts on this day
            const dayPosts = weekPosts.filter(p => {
                const pd = new Date(p.scheduled_at);
                return pd.toDateString() === dayDate.toDateString();
            });

            for (const post of dayPosts) {
                const pd = new Date(post.scheduled_at);
                entries.push({
                    id: post.id,
                    date: pd.toISOString(),
                    dayOfWeek: pd.getDay(),
                    hour: pd.getHours(),
                    post: post,
                    isOptimalTime: isOptimalTime(pd, timePatterns),
                });

                // Track platform distribution
                platformDist[post.platform] = (platformDist[post.platform] || 0) + 1;
            }

            // If no posts on this day, suggest an optimal slot
            if (dayPosts.length === 0 && dayDate > new Date()) {
                const optimalHour = getOptimalHourForDay(dayDate.getDay(), timePatterns);
                const suggestedSlot = new Date(dayDate);
                suggestedSlot.setHours(optimalHour, 0, 0, 0);

                entries.push({
                    id: `suggestion-${dayDate.toISOString()}`,
                    date: suggestedSlot.toISOString(),
                    dayOfWeek: suggestedSlot.getDay(),
                    hour: optimalHour,
                    suggestedTopic: null,
                    suggestedPlatform: null,
                    isOptimalTime: true,
                });
            }
        }

        calendarWeeks.push({
            weekNumber: getISOWeek(weekStart),
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
            entries,
            totalPosts: weekPosts.length,
            totalScheduled: weekPosts.filter((p: any) => p.status === 'scheduled').length,
            totalPublished: weekPosts.filter((p: any) => p.status === 'published').length,
        });
    }

    // Find next suggested slot
    const allEntries = calendarWeeks.flatMap(w => w.entries);
    const nextEmpty = allEntries.find(e => !e.post && new Date(e.date) > new Date());

    return {
        owner,
        weeks: calendarWeeks,
        totalPosts: posts.length,
        publishingFrequency: posts.length / Math.max(weeks, 1),
        nextSuggestedSlot: nextEmpty || null,
        platformDistribution: platformDist,
    };
}

function isOptimalTime(date: Date, patterns: any[]): boolean {
    const key = `${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()]}_${date.getHours()}`;
    return patterns.some(p => p.pattern_key === key && p.avg_engagement_rate > 0.05);
}

function getOptimalHourForDay(dayOfWeek: number, patterns: any[]): number {
    const dayPrefix = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayOfWeek];
    const dayPatterns = patterns
        .filter(p => p.pattern_key.startsWith(dayPrefix))
        .sort((a: any, b: any) => b.avg_engagement_rate - a.avg_engagement_rate);

    if (dayPatterns.length > 0) {
        const parts = dayPatterns[0].pattern_key.split('_');
        return parseInt(parts[1]) || 10;
    }

    // Default optimal hours per day
    const defaults: Record<number, number> = {
        0: 11, // Sunday
        1: 9,  // Monday
        2: 10, // Tuesday
        3: 9,  // Wednesday
        4: 10, // Thursday
        5: 9,  // Friday
        6: 11, // Saturday
    };
    return defaults[dayOfWeek] || 10;
}

function parseTimePattern(key: string): { date: Date; label: string } {
    const parts = key.split('_');
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayIndex = dayNames.indexOf(parts[0]);
    const hour = parseInt(parts[1]) || 10;

    const now = new Date();
    const date = new Date(now);
    const currentDay = date.getDay();
    const daysUntil = dayIndex >= currentDay ? dayIndex - currentDay : 7 - currentDay + dayIndex;
    date.setDate(date.getDate() + (daysUntil || 7));
    date.setHours(hour, 0, 0, 0);

    return { date, label: `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} ${hour}:00` };
}

function getDefaultOptimalSlots(count: number): Array<{ date: Date; label: string }> {
    const slots = [];
    const now = new Date();
    const optimalTimes = [
        { day: 2, hour: 9 },  // Tue 9am
        { day: 3, hour: 10 }, // Wed 10am
        { day: 4, hour: 9 },  // Thu 9am
        { day: 1, hour: 10 }, // Mon 10am
        { day: 5, hour: 9 },  // Fri 9am
    ];

    for (let i = 0; i < count; i++) {
        const { day, hour } = optimalTimes[i % optimalTimes.length];
        const date = new Date(now);
        const currentDay = date.getDay();
        const daysUntil = day >= currentDay ? day - currentDay : 7 - currentDay + day;
        const weekOffset = Math.floor(i / optimalTimes.length) * 7;
        date.setDate(date.getDate() + (daysUntil || 7) + weekOffset);
        date.setHours(hour, 0, 0, 0);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        slots.push({ date, label: `${dayNames[day]} ${hour}:00` });
    }

    return slots;
}

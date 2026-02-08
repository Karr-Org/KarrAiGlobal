/**
 * Social Media Upload API
 * POST — Upload a file to Supabase Storage and return the public URL
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getCurrentUserId(request: Request): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll() { /* no-op for reads */ },
                },
            }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) return user.id;
    } catch { /* cookie auth failed */ }
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId) return headerUserId;
    return null;
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Create a service-role Supabase client for storage access
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll() { /* no-op */ },
                },
            }
        );

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage (bucket: social-media)
        const { data, error } = await supabase.storage
            .from('social-media')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error('[Media Upload] Storage error:', error);
            // If bucket doesn't exist, try creating it
            if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
                const { error: createError } = await supabase.storage.createBucket('social-media', {
                    public: true,
                    fileSizeLimit: 50 * 1024 * 1024, // 50MB
                    allowedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
                });
                if (createError && !createError.message?.includes('already exists')) {
                    console.error('[Media Upload] Bucket creation failed:', createError);
                    return NextResponse.json({ error: 'Storage setup failed' }, { status: 500 });
                }
                // Retry upload
                const { data: retryData, error: retryError } = await supabase.storage
                    .from('social-media')
                    .upload(fileName, buffer, {
                        contentType: file.type,
                        upsert: false,
                    });
                if (retryError) {
                    console.error('[Media Upload] Retry failed:', retryError);
                    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
                }
                const { data: retryUrl } = supabase.storage
                    .from('social-media')
                    .getPublicUrl(retryData.path);
                return NextResponse.json({ url: retryUrl.publicUrl });
            }
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
            .from('social-media')
            .getPublicUrl(data.path);

        return NextResponse.json({ url: urlData.publicUrl });
    } catch (error) {
        console.error('[Media Upload] Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

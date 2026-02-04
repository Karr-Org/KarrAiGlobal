import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Create a Supabase client for browser/client-side usage
 * Uses the anon key (public, respects RLS)
 */
export function createBrowserClient(): TypedSupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
}

/**
 * Create a Supabase client for server-side usage
 * Uses the service role key (bypasses RLS) - USE WITH CAUTION
 */
export function createServerClient(): TypedSupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

/**
 * Create a Supabase client with a specific access token
 * Useful for edge functions where you have the JWT
 */
export function createClientWithToken(accessToken: string): TypedSupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        auth: {
            persistSession: false,
        },
    });
}

// Singleton for browser client
let browserClient: TypedSupabaseClient | null = null;

export function getSupabaseClient(): TypedSupabaseClient {
    if (!browserClient) {
        browserClient = createBrowserClient();
    }
    return browserClient;
}

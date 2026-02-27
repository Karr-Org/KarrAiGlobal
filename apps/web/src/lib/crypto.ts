/**
 * KARR AI - API Key Encryption/Decryption
 * 
 * Uses Supabase pgcrypto (pgp_sym_encrypt / pgp_sym_decrypt)
 * to encrypt creator API keys at rest. Keys are only decrypted
 * server-side right before making a 3rd-party API call.
 */

import { createClient } from '@supabase/supabase-js';

const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY;

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * Encrypt a plaintext API key using pgcrypto's pgp_sym_encrypt.
 * Called when the creator saves a new API tool.
 */
export async function encryptApiKey(plaintext: string): Promise<string> {
    if (!ENCRYPTION_KEY) {
        throw new Error('API_ENCRYPTION_KEY is not configured');
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc('encrypt_api_key', {
        plaintext_key: plaintext,
        encryption_passphrase: ENCRYPTION_KEY,
    });

    if (error) {
        console.error('[Crypto] Encryption failed:', error.message);
        throw new Error(`Encryption failed: ${error.message}`);
    }

    return data as string;
}

/**
 * Decrypt an encrypted API key using pgcrypto's pgp_sym_decrypt.
 * Called by the chat engine right before executing a custom API tool call.
 */
export async function decryptApiKey(encrypted: string): Promise<string> {
    if (!ENCRYPTION_KEY) {
        throw new Error('API_ENCRYPTION_KEY is not configured');
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc('decrypt_api_key', {
        encrypted_key: encrypted,
        encryption_passphrase: ENCRYPTION_KEY,
    });

    if (error) {
        console.error('[Crypto] Decryption failed:', error.message);
        throw new Error(`Decryption failed: ${error.message}`);
    }

    return data as string;
}

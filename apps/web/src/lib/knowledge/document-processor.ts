import { createClient } from '@supabase/supabase-js';
import { extractText } from 'unpdf';
// Force require for pdf-parse to avoid esm/cjs interop issues
const pdfParse = require('pdf-parse');
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateContextualSummary, extractQuickContext } from './contextual-summarizer';

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY!;
const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await fetch(`${GEMINI_EMBED_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text }] },
            }),
        });

        const data = await response.json();
        return data.embedding?.values || [];
    } catch (e) {
        console.error('Embedding error:', e);
        return [];
    }
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }

    return chunks;
}

interface UploadOptions {
    file: File;
    targetType: 'user' | 'global';
    targetId: string; // productUserId for 'user', knowledgeBaseId for 'global'
    metadata?: any;
    enableContextualSummary?: boolean;  // OmniForge Phase 1: Enable LLM context generation
}

export async function processAndUploadDocument({ file, targetType, targetId, metadata }: UploadOptions) {
    // 1. Text Extraction
    const fileBuffer = await file.arrayBuffer();
    let textContent = '';

    console.log(`[Document Processor] Processing file: "${file.name}", type: "${file.type}", size: ${file.size} bytes`);

    // Check for PDF magic bytes (%PDF)
    const first4Bytes = new Uint8Array(fileBuffer.slice(0, 4));
    const isPdfByMagic = first4Bytes[0] === 0x25 && first4Bytes[1] === 0x50 && first4Bytes[2] === 0x44 && first4Bytes[3] === 0x46;
    const isPdf = isPdfByMagic || file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (!isPdf && (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md'))) {
        textContent = new TextDecoder().decode(fileBuffer);
    } else if (isPdf) {
        console.log(`[PDF Extraction] START. Magic: ${isPdfByMagic}, Method verification...`);

        // Method 1: unpdf (Standard Import)
        try {
            const pdfBuffer = Buffer.from(fileBuffer);
            const result = await extractText(pdfBuffer);
            const rawText = Array.isArray(result.text) ? result.text.join('\n') : (result.text || '');

            if (rawText.length > 50) {
                textContent = rawText;
                console.log(`[PDF Extraction] SUCCESS (unpdf): ${textContent.length} chars`);
            } else {
                console.log(`[PDF Extraction] unpdf returned ${rawText.length} chars (insufficient)`);
            }
        } catch (e: any) {
            console.error('[PDF Extraction] unpdf failed:', e.message);
        }

        // Method 2: pdf-parse (Require)
        if (!textContent || textContent.length < 50) {
            try {
                const pdfBuffer = Buffer.from(fileBuffer);
                const data = await pdfParse(pdfBuffer);
                if (data.text && data.text.length > 50) {
                    textContent = data.text;
                    console.log(`[PDF Extraction] SUCCESS (pdf-parse): ${textContent.length} chars`);
                } else {
                    console.log(`[PDF Extraction] pdf-parse returned ${data.text?.length} chars`);
                }
            } catch (e: any) {
                console.error('[PDF Extraction] pdf-parse failed:', e.message);
            }
        }

        // Method 3: Python Script
        if (!textContent || textContent.length < 50) {
            try {
                // Determine script path
                const cwd = process.cwd();
                const possiblePaths = [
                    path.join(cwd, 'scripts', 'extract_pdf.py'),
                    path.join(cwd, 'apps', 'web', 'scripts', 'extract_pdf.py')
                ];

                const scriptPath = possiblePaths.find(p => fs.existsSync(p));

                if (scriptPath) {
                    console.log(`[PDF Extraction] Found Python script at: ${scriptPath}`);
                    const tempPath = path.join(os.tmpdir(), `pdf_${Date.now()}.pdf`);
                    await writeFileAsync(tempPath, Buffer.from(fileBuffer));

                    try {
                        const { stdout, stderr } = await execAsync(`python "${scriptPath}" "${tempPath}"`, {
                            timeout: 30000,
                            maxBuffer: 10 * 1024 * 1024
                        });

                        if (stdout && stdout.trim().length > 50) {
                            textContent = stdout.trim();
                            console.log(`[PDF Extraction] SUCCESS (Python): ${textContent.length} chars`);
                        } else if (stderr) {
                            console.warn('[PDF Extraction] Python stderr:', stderr);
                        }
                    } finally {
                        await unlinkAsync(tempPath).catch(() => { });
                    }
                } else {
                    console.error('[PDF Extraction] Python script not found in:', possiblePaths);
                }
            } catch (e: any) {
                console.error('[PDF Extraction] Python failed:', e.message);
            }
        }

        // Method 4: Gemini (Fallback)
        if (!textContent || textContent.length < 50) {
            console.log('[PDF Extraction] Falling back to Gemini AI...');
            try {
                const base64Pdf = Buffer.from(fileBuffer).toString('base64');
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: 'Extract ALL text content from this PDF document. Return ONLY the extracted text.' },
                                    { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }
                                ]
                            }]
                        })
                    }
                );
                const aiData = await response.json();
                const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (aiText && aiText.length > 50) {
                    textContent = aiText;
                    console.log(`[PDF Extraction] SUCCESS (Gemini): ${textContent.length} chars`);
                }
            } catch (e: any) {
                console.error('[PDF Extraction] Gemini failed:', e.message);
            }
        }
    } else {
        textContent = new TextDecoder().decode(fileBuffer);
    }

    // Validate extracted content
    if (!textContent || textContent.trim().length < 50) {
        throw new Error(`Could not extract meaningful text from file. Got ${textContent?.length || 0} chars. For PDFs, ensure the file contains selectable text.`);
    }

    // Check for binary garbage (if content has too many non-printable chars)
    const printableRatio = (textContent.match(/[\x20-\x7E\n\r\t]/g)?.length || 0) / textContent.length;
    if (printableRatio < 0.6) { // Lowered threshold slightly for more tolerance
        console.warn(`[Document Processor] Warning: Content appears to be binary (${(printableRatio * 100).toFixed(0)}% printable). This might be a false positive for some languages.`);
    }

    console.log(`[Document Processor] Successfully extracted ${textContent.length} chars from ${file.name}`);

    // 2. Create Document Record
    let docId: string;
    let chunksTable: string;
    let docTable: string;
    let docIdField: string;

    if (targetType === 'user') {
        docTable = 'user_documents';
        chunksTable = 'user_knowledge_chunks';
        docIdField = 'document_id'; // Match DB schema (verified via API)

        let kbId = targetId;

        const { data: doc, error } = await supabase
            .from('user_documents')
            .insert({
                user_knowledge_base_id: kbId,
                title: file.name,
                file_path: file.name,
                file_type: file.type,
                file_size_bytes: file.size,
                status: 'processing',
                metadata: metadata || {}
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create document: ${error.message}`);
        docId = doc.id;

    } else {
        // Global
        docTable = 'knowledge_documents';
        chunksTable = 'knowledge_chunks';
        docIdField = 'document_id';

        const { data: doc, error } = await supabase
            .from('knowledge_documents')
            .insert({
                knowledge_base_id: targetId,
                title: file.name,
                file_path: file.name,
                file_type: file.type,
                file_size_bytes: file.size,
                status: 'processing',
                metadata: metadata || {}
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create global document: ${error.message}`);
        docId = doc.id;
    }

    // 3. Chunk and Embed (OmniForge Phase 1: With Contextual Summarization)
    const chunks = chunkText(textContent);
    let successCount = 0;
    let firstChunkEmbedding: number[] | null = null;
    const contentSample = textContent.slice(0, 1500);

    // OmniForge: Enable contextual summaries by default for global docs, optional for user docs
    const shouldGenerateContext = metadata?.enableContextualSummary !== false && targetType === 'global';
    let previousContextSummary = '';

    console.log(`[DocumentProcessor] Processing ${chunks.length} chunks, contextual=${shouldGenerateContext}`);

    try {
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (chunk.trim().length < 20) continue;

            const embedding = await getEmbedding(chunk);

            // Store first embedding for gap detection
            if (successCount === 0 && indentifiedEmbedding(embedding)) {
                firstChunkEmbedding = embedding;
            }

            // OmniForge Phase 1: Generate contextual summary
            let contextualSummary = '';
            let structuredMetadata: Record<string, any> = {};

            if (shouldGenerateContext) {
                try {
                    const contextResult = await generateContextualSummary({
                        documentTitle: file.name,
                        documentType: file.type,
                        chunkContent: chunk,
                        chunkIndex: i,
                        totalChunks: chunks.length,
                        previousChunkSummary: previousContextSummary,
                        metadata
                    });
                    contextualSummary = contextResult.contextualSummary;
                    structuredMetadata = contextResult.structuredMetadata;
                    previousContextSummary = contextualSummary;
                } catch (ctxError) {
                    // Fallback to quick context extraction
                    contextualSummary = extractQuickContext(file.name, chunk, i);
                    console.warn('[DocumentProcessor] Contextual summary fallback:', ctxError);
                }
            }

            const chunkData: any = {
                [docIdField]: docId,
                content: chunk,
                embedding: embedding.length > 0 ? embedding : null,
                metadata: { ...metadata, chunk_index: successCount },
                // OmniForge Phase 1: New fields
                contextual_summary: contextualSummary || null,
                structured_metadata: Object.keys(structuredMetadata).length > 0 ? structuredMetadata : null
            };

            if (targetType === 'user') {
                if (metadata && metadata.productUserId) {
                    chunkData.product_user_id = metadata.productUserId;
                } else {
                    const { data: kb } = await supabase
                        .from('user_knowledge_bases')
                        .select('product_user_id')
                        .eq('id', targetId)
                        .single();
                    if (kb) chunkData.product_user_id = kb.product_user_id;
                }
            }

            const { error: chunkError } = await supabase
                .from(chunksTable)
                .insert(chunkData);

            if (!chunkError) {
                successCount++;
            } else {
                console.error('[DocumentProcessor] Chunk insert error:', chunkError.message);
            }

            // Rate limiting for contextual summarization (avoid API throttling)
            if (shouldGenerateContext && i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        // 4. Update Status
        await supabase
            .from(docTable)
            .update({
                status: 'ready',
                chunk_count: successCount,
                processed_at: new Date().toISOString()
            })
            .eq('id', docId);

        return {
            success: true,
            docId,
            chunksCreated: successCount,
            firstChunkEmbedding,
            contentSample
        };

    } catch (err: any) {
        await supabase
            .from(docTable)
            .update({
                status: 'error',
                error_message: err.message
            })
            .eq('id', docId);
        throw err;
    }
}

function indentifiedEmbedding(embedding: number[]) {
    return embedding && embedding.length > 0;
}

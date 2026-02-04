/**
 * Text Chunking Utilities
 * 
 * Smart chunking for documents with overlap and hierarchy preservation
 */

export interface ChunkOptions {
    maxTokens?: number;
    overlapTokens?: number;
    preserveStructure?: boolean;
}

export interface Chunk {
    content: string;
    index: number;
    tokenCount: number;
    sectionHierarchy: string[];
    pageNumber?: number;
}

const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_OVERLAP_TOKENS = 50;

/**
 * Simple token counter (approximate)
 * For production, use tiktoken or similar
 */
export function countTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Split text into semantic chunks
 */
export function chunkText(
    text: string,
    options: ChunkOptions = {}
): Chunk[] {
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const overlapTokens = options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;
    const preserveStructure = options.preserveStructure ?? true;

    const chunks: Chunk[] = [];

    if (preserveStructure) {
        // Split by structural elements first
        const sections = splitBySections(text);
        let globalIndex = 0;

        for (const section of sections) {
            const sectionChunks = chunkSection(section.content, maxTokens, overlapTokens);

            for (const content of sectionChunks) {
                chunks.push({
                    content,
                    index: globalIndex++,
                    tokenCount: countTokens(content),
                    sectionHierarchy: section.hierarchy,
                    pageNumber: section.pageNumber,
                });
            }
        }
    } else {
        // Simple chunking by token count
        const simpleChunks = chunkByTokens(text, maxTokens, overlapTokens);

        for (let i = 0; i < simpleChunks.length; i++) {
            chunks.push({
                content: simpleChunks[i],
                index: i,
                tokenCount: countTokens(simpleChunks[i]),
                sectionHierarchy: [],
            });
        }
    }

    return chunks;
}

interface Section {
    content: string;
    hierarchy: string[];
    pageNumber?: number;
}

/**
 * Split text into sections based on headers and structure
 */
function splitBySections(text: string): Section[] {
    const sections: Section[] = [];

    // Match markdown-style headers or numbered sections
    const headerRegex = /^(#{1,6}\s+.+|(?:\d+\.)+\s+.+|Section\s+\d+.+)/gm;
    const lines = text.split('\n');

    let currentSection: Section = {
        content: '',
        hierarchy: [],
    };

    for (const line of lines) {
        if (headerRegex.test(line)) {
            // Save previous section if it has content
            if (currentSection.content.trim()) {
                sections.push({ ...currentSection });
            }

            // Start new section
            const headerLevel = getHeaderLevel(line);
            currentSection = {
                content: line + '\n',
                hierarchy: updateHierarchy(currentSection.hierarchy, line, headerLevel),
            };
        } else {
            currentSection.content += line + '\n';
        }
    }

    // Add final section
    if (currentSection.content.trim()) {
        sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [{ content: text, hierarchy: [] }];
}

/**
 * Chunk a section by token count with overlap
 */
function chunkSection(text: string, maxTokens: number, overlapTokens: number): string[] {
    const chunks: string[] = [];
    const sentences = splitIntoSentences(text);

    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
        const sentenceTokens = countTokens(sentence);

        if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
            chunks.push(currentChunk.trim());

            // Start new chunk with overlap
            const overlapText = getOverlapText(currentChunk, overlapTokens);
            currentChunk = overlapText + ' ' + sentence;
            currentTokens = countTokens(currentChunk);
        } else {
            currentChunk += ' ' + sentence;
            currentTokens += sentenceTokens;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Simple chunking by token count
 */
function chunkByTokens(text: string, maxTokens: number, overlapTokens: number): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);

    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const word of words) {
        const wordTokens = countTokens(word);

        if (currentTokens + wordTokens > maxTokens && currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));

            // Overlap: keep last N tokens worth of words
            const overlapWords = getLastNTokensWords(currentChunk, overlapTokens);
            currentChunk = [...overlapWords, word];
            currentTokens = countTokens(currentChunk.join(' '));
        } else {
            currentChunk.push(word);
            currentTokens += wordTokens;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }

    return chunks;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
    // Handle common abbreviations and edge cases
    const sentences = text
        .replace(/([.?!])\s+/g, '$1|SPLIT|')
        .split('|SPLIT|')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    return sentences;
}

/**
 * Get header level (1-6 for markdown, or based on numbering depth)
 */
function getHeaderLevel(line: string): number {
    const hashMatch = line.match(/^(#{1,6})/);
    if (hashMatch) return hashMatch[1].length;

    const numberMatch = line.match(/^((?:\d+\.)+)/);
    if (numberMatch) return numberMatch[1].split('.').filter(Boolean).length;

    return 1;
}

/**
 * Update section hierarchy based on new header
 */
function updateHierarchy(current: string[], newHeader: string, level: number): string[] {
    const cleaned = newHeader.replace(/^#+\s*/, '').replace(/^(?:\d+\.)+\s*/, '').trim();
    const newHierarchy = [...current.slice(0, level - 1)];
    newHierarchy[level - 1] = cleaned;
    return newHierarchy;
}

/**
 * Get text for overlap (last N tokens worth)
 */
function getOverlapText(text: string, targetTokens: number): string {
    const words = text.split(/\s+/);
    return getLastNTokensWords(words, targetTokens).join(' ');
}

/**
 * Get last N tokens worth of words
 */
function getLastNTokensWords(words: string[], targetTokens: number): string[] {
    const result: string[] = [];
    let tokens = 0;

    for (let i = words.length - 1; i >= 0 && tokens < targetTokens; i--) {
        result.unshift(words[i]);
        tokens += countTokens(words[i]);
    }

    return result;
}

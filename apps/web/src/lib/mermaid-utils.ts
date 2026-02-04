/**
 * Fixes common Mermaid syntax errors to improve rendering success rate.
 * Handles issues like unquoted labels with special characters, etc.
 */
export const fixMermaidCode = (code: string): string => {
    try {
        let lines = code.split('\n');

        // 1. Detect graph type
        const firstLine = lines.find(l => l.trim().length > 0) || '';
        const isFlowchart = /^(graph|flowchart)\s/.test(firstLine);

        if (isFlowchart) {
            return lines.map(line => {
                // Skip special lines
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('subgraph') ||
                    trimmedLine === 'end' ||
                    trimmedLine.startsWith('style ') ||
                    trimmedLine.startsWith('linkStyle ') ||
                    trimmedLine.startsWith('classDef ') ||
                    trimmedLine.startsWith('class ')) {
                    return line;
                }

                // Helper to escape content for Mermaid
                const escapeContent = (content: string): string => {
                    // Remove existing quotes if present
                    content = content.replace(/^["']|["']$/g, '');
                    // Replace internal double quotes with single quotes
                    content = content.replace(/"/g, "'");
                    // Replace problematic characters that can break parsing
                    // Keep rupee symbol but remove asterisks that might cause issues
                    content = content.replace(/\*+/g, '');
                    // Convert parentheses to HTML entities to avoid parser issues
                    // Mermaid with htmlLabels:true can render these
                    content = content.replace(/\(/g, '&#40;');
                    content = content.replace(/\)/g, '&#41;');
                    // Also escape < and > to avoid HTML injection issues
                    content = content.replace(/</g, '&lt;');
                    content = content.replace(/>/g, '&gt;');
                    return content;
                };

                // Fix square brackets: id[text] -> id["text"]
                // Match: word followed by [content] where content is not already quoted
                line = line.replace(/(\b[\w\d_]+)(\s*)\[(?!")([^\]]+)\]/g, (match, id, space, content) => {
                    const escaped = escapeContent(content);
                    return `${id}${space}["${escaped}"]`;
                });

                // Fix curly braces (decision nodes): id{text} -> id{"text"}
                // This is crucial for decision nodes with special chars like ₹, ?, ()
                line = line.replace(/(\b[\w\d_]+)(\s*)\{(?!")([^\}]+)\}/g, (match, id, space, content) => {
                    const escaped = escapeContent(content);
                    return `${id}${space}{"${escaped}"}`;
                });

                // Fix parentheses (rounded nodes): id(text) -> id("text")
                // Be stricter - only match if preceded by word boundary
                line = line.replace(/(\b[\w\d_]+)(\s*)\((?!")([^\)]+)\)/g, (match, id, space, content) => {
                    // Skip if this looks like a function call or condition (common patterns)
                    if (['Yes', 'No', 'true', 'false'].includes(content.trim())) return match;
                    const escaped = escapeContent(content);
                    return `${id}${space}("${escaped}")`;
                });

                // Fix edge labels: A -- text with (parens) --> B
                // The correct way to handle special chars in edge labels is to wrap them in quotes
                line = line.replace(/(--\s+)(.+?)(\s*-->)/g, (match, prefix, edgeText, suffix) => {
                    // Only process if edge text contains parentheses
                    if (!edgeText.includes('(') && !edgeText.includes(')')) return match;
                    // If already quoted, leave it
                    if (edgeText.trim().startsWith('"') && edgeText.trim().endsWith('"')) return match;

                    // Wrap in quotes and escape internal quotes
                    const safeText = edgeText.replace(/"/g, "'");
                    return `${prefix}"${safeText}"${suffix}`;
                });

                // Also handle pipe-style edge labels: -->|text|
                line = line.replace(/(--(?:>|>\s+)?\|)([^|]+)(\|)/g, (match, prefix, edgeText, suffix) => {
                    if (!edgeText.includes('(') && !edgeText.includes(')')) return match;
                    if (edgeText.trim().startsWith('"') && edgeText.trim().endsWith('"')) return match;

                    const safeText = edgeText.replace(/"/g, "'");
                    return `${prefix}"${safeText}"${suffix}`;
                });

                return line;
            }).join('\n');
        }

        // For sequence diagrams, return as-is
        if (/^sequenceDiagram/.test(firstLine)) {
            return code;
        }

        return code;
    } catch (e) {
        console.warn('Mermaid code fix failed:', e);
        return code;
    }
};

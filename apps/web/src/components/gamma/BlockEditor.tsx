'use client';

/**
 * 📝 Block Editor
 * specialized editors for different Gamma block types
 */

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { ContentBlock, PresentationTheme } from '@/lib/gamma/types';
import { Bold, Italic, List, ListOrdered, Image as ImageIcon, Heading1, Heading2, Heading3, Loader2 } from 'lucide-react';
import { uploadPresentationImage } from '@/app/actions/presentation';

interface BlockEditorProps {
    block: ContentBlock;
    theme: PresentationTheme;
    onUpdate: (content: any) => void;
    isFocused?: boolean;
    presentationId?: string;
    userId?: string;
}

export function BlockEditor({ block, theme, onUpdate, isFocused, presentationId, userId }: BlockEditorProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const getGridArea = () => {
        if (block.position?.gridArea) return block.position.gridArea;
        return undefined;
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || block.type !== 'image') return;

        // Show immediate preview with local blob URL
        const previewUrl = URL.createObjectURL(file);
        onUpdate({ ...(block.content as any), src: previewUrl });

        // Upload to Supabase Storage for persistent URL
        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('presentationId', presentationId || 'temp');
            formData.append('userId', userId || 'anonymous');

            const result = await uploadPresentationImage(formData);

            if (result.success && result.url) {
                // Replace preview URL with permanent URL
                URL.revokeObjectURL(previewUrl);
                onUpdate({ ...(block.content as any), src: result.url });
            } else {
                setUploadError(result.error || 'Upload failed');
                // Keep the preview URL as fallback
            }
        } catch (err) {
            console.error('Image upload error:', err);
            setUploadError('Upload failed. Image will not persist after reload.');
        } finally {
            setIsUploading(false);
        }
    };

    const containerStyle: React.CSSProperties = {
        gridArea: getGridArea(),
        position: 'relative',
    };

    // Text Editor for Headings and Paragraphs
    if (['heading', 'paragraph', 'bullet-list', 'numbered-list', 'quote'].includes(block.type)) {
        return (
            <div style={containerStyle} className="group">
                <TextEditor
                    block={block}
                    theme={theme}
                    onUpdate={onUpdate}
                    autoFocus={isFocused}
                />
            </div>
        );
    }

    // Image Editor
    if (block.type === 'image') {
        const content = block.content as { src: string; alt?: string; fit?: string };
        return (
            <div style={{ ...containerStyle, borderRadius: '12px', overflow: 'hidden' }} className="group relative min-h-[200px]">
                <img
                    src={content.src}
                    alt={content.alt}
                    className="w-full h-full object-cover"
                    style={{ minHeight: '200px', objectFit: (content.fit as any) || 'cover' }}
                />

                {/* Upload Progress Overlay */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Uploading...</p>
                        </div>
                    </div>
                )}

                {/* Upload Error Toast */}
                {uploadError && (
                    <div className="absolute top-2 left-2 right-2 bg-red-500 text-white text-xs px-3 py-2 rounded-lg">
                        {uploadError}
                    </div>
                )}

                {/* Image Overlay Controls */}
                {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                        <button
                            className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium hover:bg-slate-100 text-slate-900 flex items-center gap-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImageIcon className="w-3 h-3" />
                            Upload
                        </button>
                        <button
                            className="px-3 py-1.5 bg-white/90 rounded-lg text-xs font-medium hover:bg-white text-slate-900"
                            onClick={() => {
                                const url = prompt('Enter image URL:', content.src);
                                if (url) onUpdate({ ...content, src: url });
                            }}
                        >
                            Link
                        </button>
                    </div>
                )}
            </div>
        );
    }


    // Stat Editor (Simple inputs)
    if (block.type === 'stat') {
        const content = block.content as { value: string; label: string };
        return (
            <div style={{ ...containerStyle, textAlign: 'center' }} className="group">
                <input
                    defaultValue={content.value}
                    className="bg-transparent text-center w-full focus:outline-none focus:ring-2 ring-purple-500 rounded px-1"
                    style={{
                        fontSize: '3rem',
                        fontWeight: 700,
                        fontFamily: theme.typography.headingFont,
                        color: theme.colors.primary,
                        border: 'none',
                    }}
                    onBlur={(e) => onUpdate({ ...content, value: e.target.value })}
                />
                <input
                    defaultValue={content.label}
                    className="bg-transparent text-center w-full mt-2 focus:outline-none focus:ring-2 ring-purple-500 rounded px-1"
                    style={{
                        fontSize: '0.875rem',
                        opacity: 0.7,
                        color: theme.colors.text,
                        border: 'none',
                    }}
                    onBlur={(e) => onUpdate({ ...content, label: e.target.value })}
                />
            </div>
        );
    }

    return (
        <div style={containerStyle} className="p-4 border border-dashed border-red-300 rounded text-red-500">
            Unknown block type: {block.type}
        </div>
    );
}

// ------------------------------------------------------------------
// Internal Text Editor Component using TipTap
// ------------------------------------------------------------------

function TextEditor({ block, theme, onUpdate, autoFocus }: Omit<BlockEditorProps, 'isFocused'> & { autoFocus?: boolean }) {
    // Initial content setup
    const getInitialContent = () => {
        if (block.type === 'heading') {
            const content = block.content as { text: string; level: number };
            return `<h${content.level}>${content.text}</h${content.level}>`;
        }
        if (block.type === 'paragraph') {
            return (block.content as { html: string }).html;
        }
        if (block.type === 'quote') {
            return `<blockquote>${(block.content as { text: string }).text}</blockquote>`;
        }
        if (block.type === 'bullet-list') {
            const items = (block.content as { items: string[] }).items;
            return `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
        }
        if (block.type === 'numbered-list') {
            const items = (block.content as { items: string[] }).items;
            return `<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
        }
        return '';
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({
                placeholder: 'Type something...',
            }),
        ],
        content: getInitialContent(),
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose focus:outline-none max-w-none',
                style: `color: ${theme.colors.text}; font-family: ${block.type === 'heading' ? theme.typography.headingFont : theme.typography.bodyFont}`,
            },
        },
        onUpdate: ({ editor }) => {
            // Convert HTML back to block format
            const html = editor.getHTML();

            if (block.type === 'paragraph') {
                onUpdate({ html });
            } else if (block.type === 'heading') {
                // Strip tags for heading
                const text = editor.getText();
                onUpdate({ ...block.content, text });
            } else if (block.type === 'bullet-list' || block.type === 'numbered-list') {
                // Note: Parsing lists back to array is tricky from raw HTML without a parser
                // For now, we might just store the HTML if we wanted to support rich lists
                // But our data model expects items[]. We'll do a simple extraction for this POC
                // Real implementation would use Prosemirror JSON
                const div = document.createElement('div');
                div.innerHTML = html;
                const items = Array.from(div.querySelectorAll('li')).map(li => li.innerText);
                onUpdate({ ...block.content, items });
            } else if (block.type === 'quote') {
                const text = editor.getText();
                onUpdate({ ...block.content, text });
            }
        },
        autofocus: autoFocus,
    }, [block.id]); // Re-create if block ID changes!

    // Sync style updates
    useEffect(() => {
        if (editor && !editor.isDestroyed) {
            // We can update text styles here if theme changes
        }
    }, [theme, editor]);

    // Custom styling based on block type (for heading sizes etc)
    const getStyles = () => {
        if (block.type === 'heading') {
            const level = (block.content as { level: number }).level;
            const size = theme.typography.headingSizes[`h${level}` as keyof typeof theme.typography.headingSizes];
            return {
                fontSize: size,
                fontWeight: 700,
                lineHeight: 1.2,
                fontFamily: theme.typography.headingFont,
            };
        }
        return {
            fontSize: theme.typography.bodySize,
            lineHeight: theme.typography.lineHeight,
            fontFamily: theme.typography.bodyFont,
        };
    };

    if (!editor) {
        return null;
    }

    return (
        <div style={getStyles()} className="relative">
            {/* Floating Menu could go here */}
            {editor.isFocused && (
                <div className="absolute -top-10 left-0 bg-white shadow-lg rounded-lg p-1 flex gap-1 z-10 border border-slate-200">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-1 rounded hover:bg-slate-100 ${editor.isActive('bold') ? 'bg-purple-100 text-purple-600' : ''}`}
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-1 rounded hover:bg-slate-100 ${editor.isActive('italic') ? 'bg-purple-100 text-purple-600' : ''}`}
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <div className="w-px bg-slate-200 mx-1" />
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-1 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-purple-100 text-purple-600' : ''}`}
                    >
                        <Heading1 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-1 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-100 text-purple-600' : ''}`}
                    >
                        <Heading2 className="w-4 h-4" />
                    </button>
                </div>
            )}
            <EditorContent editor={editor} />
        </div>
    );
}

export default BlockEditor;

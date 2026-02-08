import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GammaCard, PresentationTheme } from '@/lib/gamma/types';
import { getLayoutStyles } from '@/lib/gamma/layouts';
import { BlockRenderer } from './BlockRenderer';
import { BlockEditor } from './BlockEditor';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export interface CardViewProps {
    card: GammaCard;
    theme: PresentationTheme;
    isActive: boolean;
    onInView: () => void;
    isEditing?: boolean;
    onUpdateBlock?: (cardId: string, blockId: string, content: any) => void;
    onReorderBlock?: (cardId: string, activeId: string, overId: string) => void;
    presentationId?: string;
    userId?: string;
}

// Wrapper for Drag Item
function SortableBlockItem({ id, children, isEditing }: { id: string, children: React.ReactNode, isEditing?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    // We only apply transform if dragging or editing enabled
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 50 : 'auto',
        // In grid layout, we want the item to fill its slot
        height: '100%',
        width: '100%',
    };

    if (!isEditing) {
        return <div style={{ height: '100%', width: '100%' }}>{children}</div>;
    }

    return (
        <div ref={setNodeRef} style={style} className="group relative h-full w-full">
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute left-[-24px] top-6 z-20 cursor-grab opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-200 transition-opacity bg-black/20 rounded hover:bg-black/40"
                contentEditable={false}
                title="Drag to move"
            >
                <GripVertical className="w-4 h-4" />
            </div>
            {children}
        </div>
    );
}

export function CardView({ card, theme, isActive, onInView, isEditing, onUpdateBlock, onReorderBlock, presentationId, userId }: CardViewProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Intersection observer for scroll-based navigation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && entries[0].intersectionRatio > 0.5) {
                    onInView();
                }
            },
            { threshold: 0.5 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [onInView]);

    // Get background style
    const bgStyle = card.background ? {
        ...(card.background.type === 'solid' && { backgroundColor: card.background.value }),
        ...(card.background.type === 'gradient' && { background: card.background.value }),
        ...(card.background.type === 'image' && {
            backgroundImage: `url(${card.background.value})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }),
    } : { background: theme.card.background };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorderBlock?.(card.id, active.id as string, over.id as string);
        }
    };

    return (
        <div
            ref={cardRef}
            className="min-h-screen w-full flex items-center justify-center p-8"
            style={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
            }}
        >
            <motion.article
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isActive ? 1 : 0.5, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-5xl"
                style={{
                    ...bgStyle,
                    borderRadius: theme.card.borderRadius,
                    padding: theme.card.padding,
                    boxShadow: theme.card.shadow,
                    border: theme.card.border,
                    display: 'grid',
                    minHeight: '60vh',
                    gap: '1.5rem',
                    ...getLayoutStyles(card.layout),
                }}
            >
                {/* Background overlay for images */}
                {card.background?.type === 'image' && card.background.overlay && (
                    <div
                        className="absolute inset-0 rounded-inherit"
                        style={{
                            background: card.background.overlay,
                            borderRadius: 'inherit'
                        }}
                    />
                )}

                {/* Render blocks */}
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={card.blocks.map(b => b.id)} strategy={rectSortingStrategy}>
                        {card.blocks.map((block) => (
                            <SortableBlockItem key={block.id} id={block.id} isEditing={isEditing}>
                                {isEditing ? (
                                    <BlockEditor
                                        block={block}
                                        theme={theme}
                                        onUpdate={(content) => onUpdateBlock?.(card.id, block.id, content)}
                                        presentationId={presentationId}
                                        userId={userId}
                                    />
                                ) : (
                                    <BlockRenderer
                                        block={block}
                                        theme={theme}
                                        cardLayout={card.layout}
                                    />
                                )}
                            </SortableBlockItem>
                        ))}
                    </SortableContext>
                </DndContext>
            </motion.article>
        </div>
    );
}

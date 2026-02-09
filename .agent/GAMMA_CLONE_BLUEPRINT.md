# 🎨 Gamma.app Clone Blueprint

## Building a World-Class AI Presentation System for MakeMyAI

*Research compiled: February 6, 2026*

---

## 📊 Executive Summary

Based on extensive research on Gamma.app, Tome, Canva, and other AI presentation tools, here's what makes Gamma exceptional and how we can replicate it:

### Gamma's Magic Formula

1. **Card-based architecture** (not slides!)
2. **Block editor** (Notion-style drag & drop)
3. **Smart Layouts** (AI auto-arranges content)
4. **Multi-AI integration** (GPT-4, Claude, Flux, Imagen)
5. **One-click theming** with brand consistency
6. **Interactive web-native** presentations
7. **Real-time collaboration**

---

## 🏗️ Architecture Overview

### Gamma's Tech Stack (Based on GitHub forks & research)

- **Frontend**: React + TypeScript
- **Rich Text Editor**: TipTap (ProseMirror-based)
- **Drag & Drop**: dnd-kit
- **UI Components**: Chakra UI
- **AI Models**: GPT-4, Claude, Gemini, Flux, DALL-E, Imagen
- **Database**: PostgreSQL
- **Real-time**: WebSockets (for collaboration)

### Our Implementation Stack

- **Frontend**: Next.js + React + TypeScript (already have)
- **Rich Text Editor**: TipTap (to add)
- **Drag & Drop**: dnd-kit or react-beautiful-dnd (to add)
- **UI Components**: Custom + Framer Motion (already have)
- **AI Models**: Gemini (already have), can add more
- **Database**: Supabase PostgreSQL (already have)
- **Real-time**: Supabase Realtime (already have)

---

## 🎴 Core Concept: Cards vs Slides

### Traditional Slides (PowerPoint)

- Fixed dimensions
- One slide = one screen
- Limited content per slide
- Horizontal navigation only

### Gamma's Cards

- **Flexible height** (expands with content)
- **Scrollable sections** within cards
- **Nested cards** for sub-topics
- **Web-native** (responsive, any device)
- **Vertical scrolling** + horizontal navigation

### Implementation

```typescript
interface GammaCard {
    id: string;
    type: 'card' | 'nested-card';
    layout: CardLayout;
    blocks: ContentBlock[];
    background?: BackgroundConfig;
    isHidden?: boolean;
    nestedCards?: GammaCard[];
}

type CardLayout = 
    | 'single-column'
    | 'two-column'
    | 'split-left'
    | 'split-right'
    | 'accent-left'
    | 'accent-right'
    | 'full-bleed-image'
    | 'gallery'
    | 'comparison';

interface ContentBlock {
    id: string;
    type: BlockType;
    content: any;
    position: { x: number; y: number };
    size: { width: number; height: number };
}

type BlockType =
    | 'heading'
    | 'paragraph'
    | 'bullet-list'
    | 'numbered-list'
    | 'image'
    | 'video'
    | 'embed'
    | 'chart'
    | 'table'
    | 'code'
    | 'quote'
    | 'divider'
    | 'toggle'       // Collapsible content
    | 'callout'      // Highlighted box
    | 'gallery'      // Image carousel
    | 'button'       // CTA buttons
    | 'smart-layout' // Pre-designed block combos
    | 'ai-image';    // AI-generated image
```

---

## 🧱 Block-Based Editor

### Key Components

#### 1. TipTap Integration

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image 
npm install @tiptap/extension-placeholder @tiptap/extension-link
npm install @tiptap-pro/extension-drag-handle-react  # For drag handles
```

#### 2. Block Types to Support

| Block Type | Description | Priority |
|------------|-------------|----------|
| Heading | H1-H6 with font styling | 🔴 High |
| Paragraph | Rich text with formatting | 🔴 High |
| Bullet List | Unordered lists | 🔴 High |
| Numbered List | Ordered lists | 🔴 High |
| Image | Upload, Unsplash, AI-gen | 🔴 High |
| Video | YouTube, Vimeo embeds | 🟡 Medium |
| Embed | Any URL (iframes) | 🟡 Medium |
| Table | Editable data tables | 🟡 Medium |
| Chart | Bar, line, pie charts | 🟡 Medium |
| Code | Syntax highlighted | 🟢 Low |
| Quote | Styled blockquotes | 🟢 Low |
| Toggle | Collapsible sections | 🟡 Medium |
| Callout | Info/warning/tip boxes | 🟡 Medium |
| Gallery | Image grid/carousel | 🟡 Medium |
| Button | CTA with links | 🟢 Low |
| Divider | Visual separator | 🟢 Low |

#### 3. Drag & Drop with dnd-kit

```typescript
import { DndContext, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

function BlockEditor({ blocks, onReorder }) {
    return (
        <DndContext onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map(block => (
                    <DraggableBlock key={block.id} block={block} />
                ))}
            </SortableContext>
        </DndContext>
    );
}

function DraggableBlock({ block }) {
    const { attributes, listeners, setNodeRef, transform } = useSortable({ id: block.id });
    
    return (
        <div ref={setNodeRef} style={transform && { transform: `translateY(${transform.y}px)` }}>
            {/* Drag handle */}
            <div className="drag-handle" {...listeners} {...attributes}>
                <GripVertical />
            </div>
            <BlockRenderer block={block} />
        </div>
    );
}
```

---

## 🎨 Smart Layouts System

### What Gamma Does

1. User adds content (text, images)
2. AI analyzes content type and length
3. System suggests optimal layout
4. One-click to switch between layouts
5. Content auto-fits to new layout

### Implementation

```typescript
interface SmartLayout {
    id: string;
    name: string;
    category: 'text' | 'image' | 'mixed' | 'data';
    slots: LayoutSlot[];
    preview: string; // thumbnail URL
}

interface LayoutSlot {
    id: string;
    type: 'text' | 'image' | 'media' | 'any';
    position: { gridArea: string } | { x: number; y: number; w: number; h: number };
    style?: Record<string, any>;
}

// Pre-built Smart Layouts
const SMART_LAYOUTS: SmartLayout[] = [
    {
        id: 'title-centered',
        name: 'Title Centered',
        category: 'text',
        slots: [
            { id: 'title', type: 'text', position: { gridArea: 'center' } },
            { id: 'subtitle', type: 'text', position: { gridArea: 'below' } }
        ]
    },
    {
        id: 'split-image-right',
        name: 'Content + Image',
        category: 'mixed',
        slots: [
            { id: 'content', type: 'text', position: { gridArea: 'left' } },
            { id: 'image', type: 'image', position: { gridArea: 'right' } }
        ]
    },
    {
        id: 'comparison-2col',
        name: 'Two Column Comparison',
        category: 'mixed',
        slots: [
            { id: 'left-title', type: 'text', position: { gridArea: 'top-left' } },
            { id: 'left-content', type: 'text', position: { gridArea: 'bottom-left' } },
            { id: 'right-title', type: 'text', position: { gridArea: 'top-right' } },
            { id: 'right-content', type: 'text', position: { gridArea: 'bottom-right' } }
        ]
    },
    // ... 20+ more layouts
];
```

### AI Layout Recommendation

```typescript
async function recommendLayout(card: GammaCard): Promise<SmartLayout[]> {
    // Analyze content
    const hasImages = card.blocks.some(b => b.type === 'image');
    const hasLists = card.blocks.some(b => b.type.includes('list'));
    const textLength = card.blocks
        .filter(b => b.type === 'paragraph')
        .reduce((sum, b) => sum + b.content.length, 0);
    
    // Score layouts based on content
    const scores = SMART_LAYOUTS.map(layout => ({
        layout,
        score: calculateLayoutScore(layout, { hasImages, hasLists, textLength })
    }));
    
    return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(s => s.layout);
}
```

---

## 🤖 AI Generation Pipeline

### Gamma's AI Workflow

1. User provides: Topic, Audience, Tone, Length
2. AI generates outline (editable)
3. User approves/modifies outline
4. AI generates full content per card
5. AI selects/generates images for each card
6. AI applies theme and styling
7. User can refine with AI chat

### Our Implementation

```typescript
// Step 1: Generate Outline
async function generatePresentationOutline(params: GenerationParams): Promise<Outline> {
    const prompt = `Create a presentation outline:
    Topic: ${params.topic}
    Audience: ${params.audience}
    Tone: ${params.tone}
    Number of cards: ${params.cardCount}
    
    For each card, provide:
    - Title
    - Key points (2-4)
    - Suggested visual (image description)
    - Recommended layout`;
    
    const outline = await gemini.generateContent(prompt);
    return parseOutline(outline);
}

// Step 2: Generate Card Content
async function generateCardContent(card: OutlineCard, context: PresentationContext): Promise<GammaCard> {
    const prompt = `Generate detailed content for this presentation card:
    Title: ${card.title}
    Key points: ${card.keyPoints.join(', ')}
    Context: Part of presentation about "${context.topic}"
    Previous card: ${context.previousCard?.title}
    Next card: ${context.nextCard?.title}
    
    Generate:
    - Engaging text content (2-3 paragraphs or bullet points)
    - Image prompt for visual
    - Any data/statistics if relevant`;
    
    const content = await gemini.generateContent(prompt);
    return parseToGammaCard(content, card.suggestedLayout);
}

// Step 3: Generate/Select Images
async function generateCardImage(imagePrompt: string, style: ImageStyle): Promise<string> {
    // Option 1: Pollinations AI (free)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1920&height=1080&nologo=true`;
    
    // Option 2: Unsplash search
    // Option 3: Gemini Imagen (if available)
    
    return url;
}

// Step 4: AI Chat Editing
async function aiEditContent(selection: string, instruction: string, context: CardContext): Promise<string> {
    const prompt = `Edit this content based on instruction:
    
    Selected text: "${selection}"
    Instruction: "${instruction}"
    Card context: ${context.title}
    
    Provide the edited text that maintains the original style and fits the presentation.`;
    
    return await gemini.generateContent(prompt);
}
```

---

## 🎨 Theme & Brand System

### Gamma's Theme Features

- One-click theme switching
- Custom brand kit (colors, fonts, logo)
- Theme marketplace
- Extract theme from existing presentation
- Dark/light mode per theme

### Implementation

```typescript
interface PresentationTheme {
    id: string;
    name: string;
    category: 'minimal' | 'bold' | 'corporate' | 'creative' | 'dark';
    
    // Colors
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        text: string;
        textMuted: string;
    };
    
    // Typography
    typography: {
        headingFont: string;
        bodyFont: string;
        headingSizes: { h1: string; h2: string; h3: string };
        bodySize: string;
        lineHeight: number;
    };
    
    // Card styling
    card: {
        background: string | GradientDef;
        borderRadius: string;
        padding: string;
        shadow: string;
    };
    
    // Component overrides
    components: {
        button: { background: string; text: string; borderRadius: string };
        callout: { background: string; border: string };
        code: { background: string; text: string };
    };
}

// Pre-built themes
const BUILTIN_THEMES: PresentationTheme[] = [
    {
        id: 'midnight',
        name: 'Midnight',
        category: 'dark',
        colors: {
            primary: '#6366f1',
            secondary: '#818cf8',
            accent: '#f472b6',
            background: '#0f0f1a',
            surface: '#1a1a2e',
            text: '#ffffff',
            textMuted: '#a1a1aa'
        },
        // ...
    },
    {
        id: 'sunrise',
        name: 'Sunrise',
        category: 'creative',
        colors: {
            primary: '#f97316',
            secondary: '#fb923c',
            accent: '#fbbf24',
            background: '#fffbeb',
            surface: '#ffffff',
            text: '#1f2937',
            textMuted: '#6b7280'
        },
        // ...
    },
    // 20+ more themes
];
```

---

## 📱 Interactive Viewer

### Gamma's Viewer Features

- Scrollable cards (vertical)
- Keyboard navigation
- Presenter mode with notes
- Spotlight mode (focus on section)
- Mobile responsive
- Embed widgets work live
- Share with analytics

### Implementation

```typescript
interface ViewerMode {
    mode: 'normal' | 'presenter' | 'kiosk';
    showNotes: boolean;
    showProgress: boolean;
    enableInteraction: boolean;
}

function GammaViewer({ presentation, mode }: ViewerProps) {
    const [currentCard, setCurrentCard] = useState(0);
    const [spotlightBlock, setSpotlightBlock] = useState<string | null>(null);
    
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === ' ') {
                setCurrentCard(c => Math.min(c + 1, presentation.cards.length - 1));
            } else if (e.key === 'ArrowUp') {
                setCurrentCard(c => Math.max(c - 1, 0));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    return (
        <div className="gamma-viewer">
            {/* Progress indicator */}
            <ProgressBar current={currentCard} total={presentation.cards.length} />
            
            {/* Cards */}
            <div className="cards-container">
                {presentation.cards.map((card, index) => (
                    <CardView 
                        key={card.id}
                        card={card}
                        isActive={index === currentCard}
                        spotlight={spotlightBlock}
                        theme={presentation.theme}
                    />
                ))}
            </div>
            
            {/* Presenter mode: Speaker notes */}
            {mode.mode === 'presenter' && (
                <PresenterNotes 
                    notes={presentation.cards[currentCard].speakerNotes}
                    nextCard={presentation.cards[currentCard + 1]}
                />
            )}
        </div>
    );
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (2-3 days)

- [ ] Install TipTap and dnd-kit
- [ ] Create basic block editor component
- [ ] Implement 5 core block types (heading, paragraph, list, image, divider)
- [ ] Basic card structure with CSS Grid layouts
- [ ] Simple card viewer

### Phase 2: Smart Layouts (2 days)

- [ ] Define 15 Smart Layout presets
- [ ] Layout switching UI
- [ ] Auto-fit content to layouts
- [ ] Layout recommendation algorithm

### Phase 3: AI Generation (2 days)

- [ ] Outline generation with Gemini
- [ ] Content expansion per card
- [ ] Image generation/selection
- [ ] AI chat for editing

### Phase 4: Themes & Polish (2 days)

- [ ] 10 built-in themes
- [ ] Custom theme editor
- [ ] Brand kit import
- [ ] One-click theme switching

### Phase 5: Viewer & Export (1-2 days)

- [ ] Full-screen presentation mode
- [ ] Presenter mode with notes
- [ ] Progress indicators
- [ ] PPTX/PDF export

### Phase 6: Collaboration (Optional, 2-3 days)

- [ ] Real-time editing with Supabase
- [ ] Comments on cards
- [ ] Version history
- [ ] Share with permissions

---

## 📦 Required npm Packages

```bash
# Core Editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm
npm install @tiptap/extension-image @tiptap/extension-link
npm install @tiptap/extension-placeholder @tiptap/extension-underline
npm install @tiptap/extension-text-align @tiptap/extension-color
npm install @tiptap/extension-highlight @tiptap/extension-table

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# UI & Animation
npm install framer-motion (already have)
npm install react-resizable-panels  # For split layouts

# Export
npm install pptxgenjs  # PowerPoint export
npm install jspdf html2canvas  # PDF export

# Charts (optional)
npm install recharts  # For chart blocks
```

---

## 🎯 Quick Win: Enhance Current SlideViewer

Before the full rebuild, we can quickly enhance the existing SlideViewer:

1. **Add Card-like scrolling** - Vertical scroll between slides
2. **Add more layouts** - Implement 10 layout types
3. **Improve AI prompts** - Better content generation
4. **Add theme switching** - 5 quick themes
5. **Add image generation** - Use Pollinations AI

This gives 80% of Gamma's wow factor with 20% of the effort!

---

## 📊 Comparison: Current vs Target

| Feature | Current | Gamma Target |
|---------|---------|--------------|
| Slide/Card System | Basic slides | Flexible cards ✨ |
| Block Editor | None | TipTap + dnd-kit |
| Smart Layouts | 15 static | 20+ adaptive |
| AI Generation | Text only | Text + Images + Layout |
| Themes | 1 (dark) | 20+ with switcher |
| Viewer | Basic | Full presenter mode |
| Export | None | PPTX + PDF |
| Collaboration | None | Real-time |

---

## ✅ YES, We Can Build This

The good news: **90% of Gamma's features are achievable** with open-source tools:

- TipTap is free and powerful
- dnd-kit is free and performant  
- Gemini provides excellent AI generation
- Supabase gives us real-time for free
- PptxGenJS handles PowerPoint export

**Timeline estimate**: 2-3 weeks for MVP with core features

**Recommendation**: Start with Phase 1 (Block Editor) as it's the foundation for everything else.

---

*Let's build the Gamma-killer! 🚀*

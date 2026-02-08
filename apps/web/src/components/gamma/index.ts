/**
 * 🎨 Gamma Components Library
 * React components for Gamma-style presentations
 */

// Main Viewer
export { default as GammaViewer } from './GammaViewer';

// 🆕 Gamma Creator - Full Workflow
export { default as GammaCreator } from './GammaCreator';

// 🆕 Presentation Viewer - Fullscreen mode
export { default as PresentationViewer, PresentationGridView } from './PresentationViewer';
export type { Presentation, PresentationCard } from './PresentationViewer';

// 🆕 Card Editor - Inline editing
export { default as CardEditor, InlineCardEditor } from './CardEditor';
export type { CardContent } from './CardEditor';

// Template Browser & Showcase
export { default as TemplateBrowser } from './TemplateBrowser';
export { default as TemplateShowcase } from './TemplateShowcase';
export { default as TemplateWizard } from './TemplateWizard';
export type { WizardState } from './TemplateWizard';

// Preset Packs
export { default as PresetPackSelector } from './PresetPackSelector';

// Slide Renderer
export {
    GammaSlide,
    GammaPresentationViewer,
    GammaThumbnail
} from './GammaSlideRenderer';

// Template Gallery
export { default as TemplateGallery } from './TemplateGallery';

// Blocks
export { BlockEditor } from './BlockEditor';
export { BlockRenderer } from './BlockRenderer';
export type { CardViewProps } from './CardView';

// Chat Integration
export { default as GammaChatIntegration } from './GammaChatIntegration';
export { default as useGammaChat } from './useGammaChat';

/**
 * KARR AI - Presentation Library Index
 * 
 * Exports all presentation-related modules
 */

// Types
export * from './types';

// Generator
export { generatePresentation, convertToMarkdown } from './generator';

// Feedback & Learning
export {
    recordRating,
    recordDownload,
    recordView,
    recordDiscard,
    recordEdit,
    getProductPresentationAnalytics
} from './feedback';

/**
 * Marquee section configuration
 * Centralized content and settings
 */

export const MARQUEE_TEXT = "Intentional Beauty. Transparent Science. Unapologetic Luxury. Every drop is a promise kept to your skin. ";

export const MARQUEE_CONFIG = {
  repeatCount: 4,           // Times to repeat text in each block
  blockCount: 2,            // Number of blocks for seamless loop
  animationDuration: '120s', // Total animation duration
  separator: '•',
  // Responsive horizontal spacing around each repeated marquee phrase chunk
  itemPaddingInlineMobileRem: 0.5,
  itemPaddingInlineDesktopRem: 0.75,
  // Slightly loosens character spacing so words remain readable at large display sizes
  textLetterSpacingEm: 0.035,
  // Prevents vertical clipping of tall/descending letterforms in marquee rows
  textLineHeight: 1.12,
};

import heroBg from '../assets/kimia-zarifi-x4J_92kJBoY-unsplash.jpg';
import premiumModel from '../assets/premium_african_model_1775937660048.png';
import premiumSerum from '../assets/premium_serum_1775937605848.png';
import premiumLipstick from '../assets/premium_lipstick_1775937622988.png';
import premiumSkincare from '../assets/premium_skincare_routine_1775937642617.png';

export const HERO_BACKGROUND = {
  src: heroBg,
  alt: "Woman with avocado face mask"
};

export const HERO_CARDS = [
  {
    id: 'serum',
    src: premiumSerum,
    alt: "Luxury Serum Bottle",
    label: "Elixir No. 9",
    position: { top: '8%', right: '8%' },
    size: 'w-[200px] aspect-[3/4]',
    rotation: 'rotate-[12deg] hover:-rotate-2',
    zIndex: 'z-20',
  },
  {
    id: 'texture',
    src: premiumSkincare,
    alt: "Cream Texture Swatch",
    label: "Texture Study",
    labelPosition: 'top-left',
    position: { top: '52%', right: '36%' },
    size: 'w-[160px] aspect-square',
    rotation: 'rotate-[-15deg] hover:rotate-2',
    zIndex: 'z-10',
  },
  {
    id: 'model',
    src: premiumModel,
    alt: "Model Portrait",
    label: "The Radiant Gaze",
    sublabel: "Campaign",
    badge: "Muse",
    position: { bottom: '8%', right: '6%' },
    size: 'w-[340px] aspect-[4/5]',
    rotation: 'rotate-[-5deg] hover:rotate-0',
    zIndex: 'z-30',
    isMain: true,
  },
  {
    id: 'gold-oil',
    src: "https://images.unsplash.com/photo-1601049676869-702ea24cfd58?q=80&w=800&auto=format&fit=crop",
    alt: "Gold Oil Texture",
    position: { top: '20%', right: '32%' },
    size: 'w-[150px] aspect-[2/3]',
    rotation: 'rotate-[8deg] hover:-rotate-3',
    zIndex: 'z-10',
    opacity: 'opacity-90',
  },
  {
    id: 'powder',
    src: premiumLipstick,
    alt: "Crushed Cosmetic Powder",
    label: "Pigment",
    labelPosition: 'top-right',
    position: { bottom: '35%', right: '24%' },
    size: 'w-[170px] aspect-square',
    rotation: 'rotate-[20deg] hover:rotate-6',
    zIndex: 'z-40',
  },
];

export const HERO_CONFIG = {
  particleCount: 15, // Reduced for better performance
  parallaxIntensity: 50,
  parallaxScale: 1.2,
};

/** Words that rotate in the hero headline (replacing the static "Radiance") */
export const HERO_ROTATING_WORDS = [
  'Radiance',
  'Opulence',
  'Eminence',
  'Grandeur',
  'Elegance',
  'Splendor',
  'Botanica',
  'Heritage',
];

export const HERO_ROTATION_CONFIG = {
  intervalMs: 3000,
  transitionMs: 400,
  // Adds slight character spacing to avoid compressed/cut-looking glyph edges
  textLetterSpacingEm: 0.02,
  // Keeps rotating word ascenders/descenders fully visible within tight heading rhythm
  textLineHeight: 1.05,
  // Responsive inline padding so first/last letters don't appear clipped during animation
  textPaddingInlineMobileEm: 0.08,
  textPaddingInlineDesktopEm: 0.12,
};

/** All editorial copy shown in the hero section */
export const HERO_COPY = {
  collectionLabel: "Archive Summer '25 Collection",
  headlineParts: ['The', 'Report.'],
  subtitle: 'Merging molecular botanical science with the artistry of velvet pigments. A new standard for the illuminating ritual.',
  priceLabel: 'Starting At',
  priceValue: '$42.00',
  primaryCta: 'Shop the Archive',
  secondaryCta: 'Explore the Lab',
  secondaryCtaAriaLabel: 'Explore the Lab - Learn about our science and research',
  featuredLabel: 'Featured Masterpiece',
  featuredProduct: 'The Velvet Botanique No. 4',
  scrollHint: 'Scroll',
};

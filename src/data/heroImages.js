/**
 * Hero section image configuration
 * Centralized source of truth for all hero imagery
 */

export const HERO_BACKGROUND = {
  src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1200&auto=format&fit=crop",
  alt: "Portrait of a beautiful woman"
};

export const HERO_CARDS = [
  {
    id: 'serum',
    src: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800&auto=format&fit=crop",
    alt: "Luxury Serum Bottle",
    label: "Elixir No. 9",
    position: { top: '8%', right: '8%' },
    size: 'w-[200px] aspect-[3/4]',
    rotation: 'rotate-[12deg] hover:-rotate-2',
    zIndex: 'z-20',
  },
  {
    id: 'texture',
    src: "https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?q=80&w=800&auto=format&fit=crop",
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
    src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop",
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
    src: "https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=800&auto=format&fit=crop",
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

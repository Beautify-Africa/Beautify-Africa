/**
 * Hero section image configuration
 * Centralized source of truth for all hero imagery
 */

export const HERO_BACKGROUND = {
  src: "https://images.unsplash.com/photo-1490623970972-ae8bb3da443e?q=80&w=2550&auto=format&fit=crop",
  alt: "Soft focus botanical beauty background"
};

export const HERO_CARDS = [
  {
    id: 'serum',
    src: "https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?q=80&w=800&auto=format&fit=crop",
    alt: "Luxury Serum Bottle",
    label: "Elixir No. 9",
    position: { top: '8%', right: '8%' },
    size: 'w-[200px] aspect-[3/4]',
    rotation: 'rotate-[12deg] hover:-rotate-2',
    zIndex: 'z-20',
  },
  {
    id: 'texture',
    src: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=800&auto=format&fit=crop",
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
    src: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?q=80&w=800&auto=format&fit=crop",
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
    src: "https://images.unsplash.com/photo-1567721913486-6585f069b332?q=80&w=800&auto=format&fit=crop",
    alt: "Gold Oil Texture",
    position: { top: '20%', right: '32%' },
    size: 'w-[150px] aspect-[2/3]',
    rotation: 'rotate-[8deg] hover:-rotate-3',
    zIndex: 'z-10',
    opacity: 'opacity-90',
  },
  {
    id: 'powder',
    src: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop",
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
  particleCount: 30,
  parallaxIntensity: 50,
  parallaxScale: 1.2,
};

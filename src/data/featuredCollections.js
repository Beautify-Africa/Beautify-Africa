/**
 * Featured/Current Obsession section configuration
 * Product highlights and collections
 */

export const FEATURED_CONTENT = {
  heading: 'Current Obsession',
  tagline: 'Selected Masterpieces for Modern Rituals',
};

export const FEATURED_COLLECTIONS = [
  {
    id: 'best-seller',
    title: 'Best Seller',
    productName: 'The Velvet Botanique',
    badge: 'The Icon',
    price: '$42.00',
    desc: 'Engineered with proprietary pigment technology, this lipstick delivers intense, opaque color that blurs imperfections in a single stroke. The core is infused with Wild Orchid Extract and Hyaluronic Spheres, ensuring continuous hydration alongside a weightless, transfer-resistant velvet suede finish. It is the ultimate balance of bold pigment and botanical care.',
    image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=1200&auto=format&fit=crop',
    color: 'from-rose-950/95',
    position: 'left',   // Card positioning: left, center, right
  },
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    productName: 'The Artistry Sculpt Collection',
    badge: 'Just Arrived',
    price: '$95.00',
    desc: 'Precision tools featuring ultra-fine, 100% vegan synthetic bristles designed to mimic natural hair for superior blending. Each brush is hand-bound in a weighted, sustainable ash wood handle for perfect balance. This hypoallergenic 5-piece set includes every essential needed to turn your daily application into a professional ritual.',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdd403ea2?q=80&w=1200&auto=format&fit=crop',
    color: 'from-stone-950/95',
    position: 'center',
  },
  {
    id: 'trending',
    title: 'Trending',
    productName: 'The Clarity Corrector',
    badge: 'Latest Formulation',
    price: '$65.00',
    desc: 'A targeted fluid that treats blemishes without compromising the skin barrier. 2% Encapsulated Salicylic Acid deeply purges pores, while a soothing complex of Centella Asiatica and Niacinamide instantly reduces redness. It dries down to an invisible matte finish, healing active breakouts while preventing future congestion without surface dryness.',
    image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=1200&auto=format&fit=crop',
    color: 'from-teal-950/95',
    position: 'right',
  },
];

/**
 * Card position styles mapping
 */
export const CARD_POSITIONS = {
  left: 'lg:translate-y-16 lg:rotate-[-3deg] z-10',
  center: 'lg:-translate-y-8 z-20 scale-100 lg:scale-105 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]',
  right: 'lg:translate-y-16 lg:rotate-[3deg] z-10',
};

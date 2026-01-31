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
    position: 'left',
    color: 'from-rose-950/95',
    items: [
      {
        productName: 'The Velvet Botanique',
        badge: 'The Icon',
        price: '$42.00',
        desc: 'Engineered with proprietary pigment technology, this lipstick delivers intense, opaque color that blurs imperfections in a single stroke.',
        image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=1200&auto=format&fit=crop',
      },
      {
        productName: 'Rouge Absolu',
        badge: 'Limited Edition',
        price: '$48.00',
        desc: 'A scarlet masterpiece infused with diamond powder for a finish that captures light from every angle.',
        image: 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=1200',
      },
      {
        productName: 'Petal Stain No. 5',
        badge: 'Best Rated',
        price: '$38.00',
        desc: 'A whispered wash of color that mimics the flushed glow of a post-facial complexion. Build-able and weightless.',
        image: 'https://images.pexels.com/photos/2536585/pexels-photo-2536585.jpeg?auto=compress&cs=tinysrgb&w=1200',
      }
    ]
  },
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    position: 'center',
    color: 'from-stone-950/95',
    items: [
      {
        productName: 'The Artistry Sculpt Collection',
        badge: 'Just Arrived',
        price: '$95.00',
        desc: 'Precision tools featuring ultra-fine, 100% vegan synthetic bristles designed to mimic natural hair for superior blending.',
        image: 'https://images.pexels.com/photos/3321416/pexels-photo-3321416.jpeg?auto=compress&cs=tinysrgb&w=1200',
      },
      {
        productName: 'The Foundation Buff',
        badge: 'Artist Pick',
        price: '$45.00',
        desc: 'A kabuki-style dense brush that polishes foundation into the skin for an airbrushed, poreless finish.',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdd403ea2?q=80&w=1200&auto=format&fit=crop',
      }
    ]
  },
  {
    id: 'trending',
    title: 'Trending',
    position: 'right',
    color: 'from-teal-950/95',
    items: [
      {
        productName: 'The Clarity Corrector',
        badge: 'Latest Formulation',
        price: '$65.00',
        desc: 'A targeted fluid that treats blemishes without compromising the skin barrier. 2% Encapsulated Salicylic Acid.',
        image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=1200&auto=format&fit=crop',
      },
      {
        productName: 'Luminous Oil Drops',
        badge: 'Viral Hit',
        price: '$72.00',
        desc: 'Cold-pressed botanical oils suspended in a water-light matrix to deliver deep nourishment without greasiness.',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200&auto=format&fit=crop',
      },
      {
        productName: 'Night Renewal Ampoule',
        badge: 'Award Winner',
        price: '$88.00',
        desc: 'Retinol reimagined. High-potency resurfacing with zero irritation, working overnight to reveal glass skin.',
        image: 'https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?q=80&w=1200&auto=format&fit=crop',
      }
    ]
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

/**
 * Journal section configuration
 * Editorial articles and blog content
 */

export const JOURNAL_CONTENT = {
  tagline: 'Editorial',
  heading: 'The Journal',
  description: 'Expert beauty tutorials, shade-matching guides, and cosmetics science.',
};

export const JOURNAL_ARTICLES = {
  featured: {
    id: 'shade-matching-guide',
    category: 'Complexion & Shades',
    categoryColor: 'text-white',
    title: 'Finding Your Undertone / The Inclusive Shade Guide',
    excerpt:
      'From cool olive to deep rich warm undertones, our beauty experts share how to identify your true complexion match across global beauty brands.',
    image:
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1200&auto=format&fit=crop',
    cta: 'Read Full Guide',
  },
  secondary: [
    {
      id: 'long-wear-makeup',
      category: 'Makeup Artistry',
      categoryColor: 'text-amber-200',
      hoverColor: 'hover:text-amber-200',
      title: 'Prep to Set: 16-Hour Transfer-Proof Makeup',
      excerpt:
        'A masterclass on skin prep, primer pairing, and powder baking for vibrant, crease-free wear in any climate.',
      image:
        'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?q=80&w=1200&auto=format&fit=crop',
      cta: 'View Routine',
    },
    {
      id: 'cruelty-free-science',
      category: 'Clean Beauty & Ethics',
      categoryColor: 'text-teal-200',
      hoverColor: 'hover:text-teal-200',
      title: '100% Cruelty-Free: Modern High-Impact Glamour',
      excerpt:
        'Discover how top global beauty laboratories engineer vibrant pigments and barrier-restoring skincare with zero animal testing.',
      image:
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200&auto=format&fit=crop',
      cta: 'Learn More',
    },
  ],
};

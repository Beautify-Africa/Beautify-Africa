/**
 * Journal section configuration
 * Editorial articles and blog content
 */

export const JOURNAL_CONTENT = {
  tagline: 'Editorial',
  heading: 'The Journal',
  description: 'Expert insights, botanical science, and the art of application.',
};

export const JOURNAL_ARTICLES = {
  featured: {
    id: 'cold-press-extraction',
    category: 'Ingredient Focus',
    categoryColor: 'text-white',
    title: 'The Science of Cold-Press Extraction',
    excerpt: 'Why heat destroys potency. We explore how our proprietary cold-press method preserves active antioxidants in our Wild Orchid serum.',
    image: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=1200&auto=format&fit=crop',
    cta: 'Read Full Study',
  },
  secondary: [
    {
      id: 'texture-layering',
      category: 'Rituals & Routine',
      categoryColor: 'text-amber-200',
      hoverColor: 'hover:text-amber-200',
      title: 'The Art of Layering Textures',
      excerpt: 'A definitive guide to the correct order of application for maximum absorption and flawless finish.',
      image: 'https://images.unsplash.com/photo-1567721913486-6585f069b332?q=80&w=1200&auto=format&fit=crop',
      cta: 'View the Guide',
    },
    {
      id: 'moisture-barrier',
      category: 'Skin Biology',
      categoryColor: 'text-teal-200',
      hoverColor: 'hover:text-teal-200',
      title: 'Understanding the Barrier',
      excerpt: 'We break down what the acid mantle is and the specific lipids needed to rebuild it.',
      image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1200&auto=format&fit=crop',
      cta: 'Learn More',
    },
  ],
};

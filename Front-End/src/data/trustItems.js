import topBrandsImg from '../assets/trust_top_brands.jpg';
import provenResultsImg from '../assets/trust_proven_results.jpg';
import skinTonesImg from '../assets/trust_skin_tones.jpg';
import crueltyFreeImg from '../assets/trust_cruelty_free.jpg';
import fastShippingImg from '../assets/trust_fast_shipping.jpg';
import easyReturnsImg from '../assets/trust_easy_returns.jpg';
import beautySupportImg from '../assets/trust_beauty_support.jpg';

/**
 * Trust/USP section configuration
 * Unique selling propositions and brand values
 */

export const USP_CONTENT = {
  tagline: 'Why Choose Beautify',
  heading: 'The Beauty Experience You Deserve',
  description:
    'From world-renowned brands and inclusive shade ranges to expert support and cruelty-free ethics, discover what makes us your ultimate beauty destination.',
};

export const TRUST_ITEMS = [
  {
    id: 'top-global-brands',
    label: 'Top Global Brands',
    image: topBrandsImg,
    desc: 'From everyday makeup to luxury skincare, we bring you the world’s best beauty products all in one place.',
    className: 'md:col-span-2 md:row-span-2',
  },
  {
    id: 'proven-results',
    label: 'Proven Results',
    image: provenResultsImg,
    desc: 'We only stock products known for real results, long-lasting wear, and vibrant colors you can count on.',
    className: 'md:col-span-1 md:row-span-2',
  },
  {
    id: 'every-skin-tone',
    label: 'For Every Skin Tone',
    image: skinTonesImg,
    desc: 'Beauty without boundaries. We offer a massive range of shades and formulas to match every skin type, tone, and texture.',
    className: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 'cruelty-free',
    label: '100% Cruelty-Free',
    image: crueltyFreeImg,
    desc: 'We only partner with brands that love animals as much as we do. Zero animal testing, ever.',
    className: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 'global-shipping',
    label: 'Fast Global Shipping',
    image: fastShippingImg,
    desc: 'Get your beauty essentials delivered quickly and securely to your door, no matter where you live.',
    className: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 'easy-returns',
    label: 'Easy Returns',
    image: easyReturnsImg,
    desc: 'Didn’t find your perfect match? Send it back hassle-free for a full refund or exchange.',
    className: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 'beauty-support',
    label: '24/7 Beauty Support',
    image: beautySupportImg,
    desc: 'Need help finding your shade or building a skincare routine? Our beauty experts are ready to help anytime.',
    className: 'md:col-span-2 md:row-span-1',
  },
];

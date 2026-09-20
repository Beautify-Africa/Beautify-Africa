function buildCloudinaryFormatSrcSet(url, widths, format = 'auto') {
  if (typeof url !== 'string' || !url.includes('/upload/')) return null;

  const srcSet = widths
    .map((width) => {
      const transformed = url.replace(
        '/upload/',
        `/upload/f_${format},q_auto,dpr_auto,w_${width}/`
      );
      return `${transformed} ${width}w`;
    })
    .join(', ');

  return { srcSet };
}

function buildRemoteCdnFormatSrcSet(url, widths, format = null) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const isUnsplash = hostname.includes('unsplash.com');
    const isPexels = hostname.includes('pexels.com');
    if (!isUnsplash && !isPexels) return null;

    const srcSet = widths
      .map((width) => {
        const candidate = new URL(parsed.toString());
        candidate.searchParams.set('w', String(width));
        if (isUnsplash) {
          if (format) {
            candidate.searchParams.set('fm', format);
          } else {
            candidate.searchParams.set('auto', 'format');
          }
          candidate.searchParams.set('fit', 'crop');
        }
        return `${candidate.toString()} ${width}w`;
      })
      .join(', ');

    return { srcSet };
  } catch {
    return null;
  }
}

/**
 * Builds next-generation picture source elements (AVIF, WebP) for modern format negotiation.
 * Enables 20-50% smaller payload sizes on browsers supporting AVIF (Chrome, Safari 16+, Firefox 93+).
 */
export function buildPictureSources(url, options = {}) {
  if (typeof url !== 'string' || !url.trim()) return [];

  const widths = options.widths || [320, 480, 720, 960];
  const sources = [];

  // 1. Cloudinary AVIF & WebP
  if (url.includes('/upload/')) {
    const avifSrcSet = buildCloudinaryFormatSrcSet(url, widths, 'avif');
    if (avifSrcSet) {
      sources.push({
        type: 'image/avif',
        srcSet: avifSrcSet.srcSet,
      });
    }
    const webpSrcSet = buildCloudinaryFormatSrcSet(url, widths, 'webp');
    if (webpSrcSet) {
      sources.push({
        type: 'image/webp',
        srcSet: webpSrcSet.srcSet,
      });
    }
    return sources;
  }

  // 2. Unsplash AVIF & WebP
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('unsplash.com')) {
      const avifSrcSet = buildRemoteCdnFormatSrcSet(url, widths, 'avif');
      if (avifSrcSet) {
        sources.push({
          type: 'image/avif',
          srcSet: avifSrcSet.srcSet,
        });
      }
      const webpSrcSet = buildRemoteCdnFormatSrcSet(url, widths, 'webp');
      if (webpSrcSet) {
        sources.push({
          type: 'image/webp',
          srcSet: webpSrcSet.srcSet,
        });
      }
    }
  } catch {
    // non-URL strings fall back safely
  }

  return sources;
}

export function buildResponsiveImageProps(url, options = {}) {
  if (typeof url !== 'string' || !url.trim()) {
    return { src: url, sources: [] };
  }

  const widths = options.widths || [320, 480, 720, 960];
  const sizes = options.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw';
  const sources = buildPictureSources(url, { widths });

  const cloudinary = buildCloudinaryFormatSrcSet(url, widths, 'auto');
  if (cloudinary) {
    return {
      src: url,
      srcSet: cloudinary.srcSet,
      sizes,
      sources,
    };
  }

  const remoteCdn = buildRemoteCdnFormatSrcSet(url, widths);
  if (remoteCdn) {
    return {
      src: url,
      srcSet: remoteCdn.srcSet,
      sizes,
      sources,
    };
  }

  return { src: url, sources: [] };
}

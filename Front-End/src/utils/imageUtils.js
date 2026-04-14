function buildCloudinarySrcSet(url, widths) {
  if (typeof url !== 'string' || !url.includes('/upload/')) return null;

  const srcSet = widths
    .map((width) => {
      const transformed = url.replace('/upload/', `/upload/f_auto,q_auto,dpr_auto,w_${width}/`);
      return `${transformed} ${width}w`;
    })
    .join(', ');

  return { srcSet };
}

function buildRemoteCdnSrcSet(url, widths) {
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
          candidate.searchParams.set('auto', 'format');
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

export function buildResponsiveImageProps(url, options = {}) {
  if (typeof url !== 'string' || !url.trim()) {
    return { src: url };
  }

  const widths = options.widths || [320, 480, 720];
  const sizes = options.sizes || '(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 22vw';

  const cloudinary = buildCloudinarySrcSet(url, widths);
  if (cloudinary) {
    return {
      src: url,
      srcSet: cloudinary.srcSet,
      sizes,
    };
  }

  const remoteCdn = buildRemoteCdnSrcSet(url, widths);
  if (remoteCdn) {
    return {
      src: url,
      srcSet: remoteCdn.srcSet,
      sizes,
    };
  }

  return { src: url };
}

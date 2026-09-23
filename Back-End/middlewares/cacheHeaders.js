function setPublicCache(seconds, staleWhileRevalidateSeconds = 0) {
  return function cacheHeaderMiddleware(req, res, next) {
    const directives = ['public', `max-age=${Math.max(0, Number(seconds) || 0)}`];

    if ((Number(staleWhileRevalidateSeconds) || 0) > 0) {
      directives.push(
        `stale-while-revalidate=${Math.max(0, Number(staleWhileRevalidateSeconds) || 0)}`
      );
    }

    res.set('Cache-Control', directives.join(', '));
    next();
  };
}

function setEdgeCdnCache(
  clientSeconds = 60,
  sMaxAgeSeconds = 3600,
  staleWhileRevalidateSeconds = 600
) {
  return function edgeCacheMiddleware(req, res, next) {
    const directives = [
      'public',
      `max-age=${Math.max(0, Number(clientSeconds) || 0)}`,
      `s-maxage=${Math.max(0, Number(sMaxAgeSeconds) || 0)}`,
      `stale-while-revalidate=${Math.max(0, Number(staleWhileRevalidateSeconds) || 0)}`,
    ];

    res.set('Cache-Control', directives.join(', '));
    res.set('Surrogate-Control', `max-age=${Math.max(0, Number(sMaxAgeSeconds) || 0)}`);
    next();
  };
}

function setPrivateNoStore(req, res, next) {
  res.set('Cache-Control', 'private, no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}

module.exports = {
  setPublicCache,
  setEdgeCdnCache,
  setPrivateNoStore,
};

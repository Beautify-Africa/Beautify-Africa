function setPublicCache(seconds, staleWhileRevalidateSeconds = 0) {
  return function cacheHeaderMiddleware(req, res, next) {
    const directives = [
      'public',
      `max-age=${Math.max(0, Number(seconds) || 0)}`,
    ];

    if ((Number(staleWhileRevalidateSeconds) || 0) > 0) {
      directives.push(
        `stale-while-revalidate=${Math.max(0, Number(staleWhileRevalidateSeconds) || 0)}`
      );
    }

    res.set('Cache-Control', directives.join(', '));
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
  setPrivateNoStore,
};

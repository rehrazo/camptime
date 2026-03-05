function getAdminTokenFromRequest(req) {
  const explicitToken = String(req.headers['x-admin-token'] || '').trim();
  if (explicitToken) {
    return explicitToken;
  }

  const authorization = String(req.headers.authorization || '').trim();
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return '';
}

function requireAdminAuthIfConfigured(req, res, next) {
  const isReadOnlyMethod = ['GET', 'HEAD', 'OPTIONS'].includes(String(req.method || '').toUpperCase());
  if (isReadOnlyMethod) {
    return next();
  }

  const configuredToken = String(process.env.ADMIN_API_TOKEN || '').trim();
  if (!configuredToken) {
    return res.status(500).json({ error: 'Server misconfiguration: ADMIN_API_TOKEN is not set' });
  }

  const providedToken = getAdminTokenFromRequest(req);
  if (providedToken && providedToken === configuredToken) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: valid admin token required' });
}

module.exports = {
  requireAdminAuthIfConfigured,
};

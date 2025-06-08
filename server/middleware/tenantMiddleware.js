const db = require('../database/connection');
const logger = require('../utils/logger');

/**
 * Middleware to resolve tenant from subdomain or domain
 * Sets req.tenant with institution information
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    let tenant = null;
    const host = req.get('host') || req.get('x-forwarded-host');
    
    if (!host) {
      return res.status(400).json({
        success: false,
        message: 'Host header is required'
      });
    }

    // Extract subdomain or check for custom domain
    const hostParts = host.split('.');
    let subdomain = null;
    let isCustomDomain = false;

    if (hostParts.length >= 3 && hostParts[hostParts.length - 2] === 'scholarbridgelms') {
      // Standard subdomain: institution.scholarbridgelms.com
      subdomain = hostParts[0];
    } else if (hostParts.length === 2 || (hostParts.length === 3 && hostParts[0] === 'www')) {
      // Potential custom domain: institution.com or www.institution.com
      isCustomDomain = true;
    } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
      // Development environment - check for subdomain or use default
      if (hostParts.length >= 2) {
        subdomain = hostParts[0];
      }
    }

    // Query database for institution
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      tenant = await db('institutions')
        .where({ subdomain, is_active: true })
        .first();
    } else if (isCustomDomain) {
      // Check for custom domain mapping (future feature)
      tenant = await db('institutions')
        .where({ custom_domain: host, is_active: true })
        .first();
    }

    // Handle tenant not found
    if (!tenant && subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return res.status(404).json({
        success: false,
        message: 'Institution not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // For main domain or API calls without tenant
    if (!tenant) {
      // Allow certain routes without tenant (like super admin, health check)
      const allowedPaths = ['/health', '/api/super-admin', '/api/auth/super-admin'];
      const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));
      
      if (!isAllowedPath) {
        return res.status(400).json({
          success: false,
          message: 'Institution context required',
          code: 'TENANT_REQUIRED'
        });
      }
    }

    // Set tenant information in request
    req.tenant = tenant;
    req.institutionId = tenant?.id;

    // Log tenant resolution
    if (tenant) {
      logger.info(`Tenant resolved: ${tenant.name} (${tenant.subdomain})`, {
        institutionId: tenant.id,
        subdomain: tenant.subdomain,
        host,
        path: req.path
      });
    }

    next();
  } catch (error) {
    logger.error('Tenant resolution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during tenant resolution'
    });
  }
};

module.exports = tenantMiddleware;
const TokenUtil = require('../utils/token.util');
const ErrorHttp = require('../http/error.http');

class PermissionMiddleware {

    static authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                throw new ErrorHttp(401, 'Authorization header is required');
            }

            const token = TokenUtil.getTokenFromHeader(authHeader);

            const decoded = TokenUtil.verifyToken(token);

            if (!decoded || !decoded.userId) {
                throw new ErrorHttp(401, 'Invalid token payload');
            }

            req.userId = decoded.userId;
            req.token = token;

            next();
        } catch (error) {
            if (error instanceof ErrorHttp) {
                return next(error);
            }
            return next(new ErrorHttp(401, error.message || 'Authentication failed'));
        }
    }

    static requirePermission(requiredPermissions, options = {}) {
        const { mode = 'OR' } = options;

        return async (req, res, next) => {
            try {
                if (!req.userId) {
                    throw new ErrorHttp(401, 'Authentication required');
                }

                const prisma = req.container.resolve('prisma');

                if (!req.adminPermissions) {
                    const admin = await prisma.admin.findUnique({
                        where: { id: req.userId },
                        include: {
                            roles: {
                                include: {
                                    role: {
                                        include: {
                                            rolePermission: {
                                                include: {
                                                    permission: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });

                    if (!admin) {
                        throw new ErrorHttp(404, 'Admin not found');
                    }

                    if (!admin.isActive) {
                        throw new ErrorHttp(403, 'Admin account is inactive');
                    }

                    const isSuperAdmin = admin.roles.some(adminRole => adminRole.role.isSuperAdmin === true);

                    const permissions = new Set();
                    admin.roles.forEach(adminRole => {
                        adminRole.role.rolePermission.forEach(rp => {
                            permissions.add(rp.permission.permissionName);
                        });
                    });

                    req.adminPermissions = Array.from(permissions);
                    req.isSuperAdmin = isSuperAdmin;
                    req.admin = {
                        id: admin.id,
                        username: admin.username,
                        name: admin.name,
                        email: admin.email,
                        isActive: admin.isActive,
                        isSuperAdmin: isSuperAdmin
                    };
                }

                if (req.isSuperAdmin) {
                    return next();
                }

                const permissionsArray = Array.isArray(requiredPermissions)
                    ? requiredPermissions
                    : [requiredPermissions];

                let hasPermission = false;

                if (mode === 'OR') {
                    hasPermission = permissionsArray.some(permission =>
                        req.adminPermissions.includes(permission)
                    );
                } else if (mode === 'AND') {
                    hasPermission = permissionsArray.every(permission =>
                        req.adminPermissions.includes(permission)
                    );
                }

                if (!hasPermission) {
                    const permissionList = permissionsArray.join(mode === 'OR' ? ' OR ' : ' AND ');
                    throw new ErrorHttp(
                        403,
                        `Access denied. Required permission: ${permissionList}`
                    );
                }

                next();
            } catch (error) {
                if (error instanceof ErrorHttp) {
                    return next(error);
                }
                return next(new ErrorHttp(500, error.message || 'Permission check failed'));
            }
        };
    }

    static requireAnyPermission(...permissions) {
        return this.requirePermission(permissions, { mode: 'OR' });
    }

    static requireAllPermissions(...permissions) {
        return this.requirePermission(permissions, { mode: 'AND' });
    }

    static checkPermission(permissionName) {
        return (req, res, next) => {
            if (!req.adminPermissions) {
                return next(new ErrorHttp(401, 'Authentication required'));
            }

            if (!req.adminPermissions.includes(permissionName)) {
                return next(new ErrorHttp(403, `Access denied. Required permission: ${permissionName}`));
            }

            next();
        };
    }

    static hasPermission(req, permissionName) {
        if (req.isSuperAdmin) {
            return true;
        }
        if (!req.adminPermissions) {
            return false;
        }
        return req.adminPermissions.includes(permissionName);
    }

    static hasAnyPermission(req, ...permissions) {
        if (req.isSuperAdmin) {
            return true;
        }
        if (!req.adminPermissions) {
            return false;
        }
        return permissions.some(permission => req.adminPermissions.includes(permission));
    }

    static hasAllPermissions(req, ...permissions) {
        if (req.isSuperAdmin) {
            return true;
        }
        if (!req.adminPermissions) {
            return false;
        }
        return permissions.every(permission => req.adminPermissions.includes(permission));
    }
}

module.exports = PermissionMiddleware;


const BaseService = require("../../shared/base/base.service")

class RolePermissionService extends BaseService {
    constructor(rolePermissionRepository, logger) {
        super(rolePermissionRepository, logger)
        this.rolePermissionRepository = rolePermissionRepository
    }

    async permissions() {
        try {
            return await this.rolePermissionRepository.permissions()

        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async rolePermissions() {
        try {
            const roles = await this.rolePermissionRepository.rolePermissions()

            return roles.map((role) => ({
                id : role.id,
                roleName : role.roleName,
                permission : role.rolePermission.map((rp)=> ({
                    id : rp.permission.id,
                    permissionName : rp.permission.permissionName,
                    resource : rp.permission.resource,
                    action : rp.permission.action 
                }))
            }))

        } catch (err) {
            this.logger.error(err)
            throw err
        }
}
}

module.exports = RolePermissionService
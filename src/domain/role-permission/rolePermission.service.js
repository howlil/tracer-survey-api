const BaseService = require("../../shared/base/base.service")

class RolePermissionService extends BaseService {
    constructor(rolePermissionRepository, logger) {
        super(rolePermissionRepository, logger)
        this.rolePermissionRepository = rolePermissionRepository
    }

    async findMany(options = {}) {
        try {
            const { page = 1, limit = 10, search } = options

            const result = await this.rolePermissionRepository.findManyWithPagination({
                page,
                limit,
                search
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async findUnique(options = {}) {
        try {
            const result = await this.rolePermissionRepository.findUniqueWithPermissions(options)
            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async create(options = {}) {
        try {
            const { data } = options
            const { permissionIds, roleName, description } = data

            // Convert permissionIds to permissions format
            const permissions = (permissionIds || []).map(permId => {
                const [resource, action] = permId.split('.')
                return `${resource}.${action}`
            })

            const result = await this.rolePermissionRepository.createWithPermissions({
                roleData: { name: roleName, description },
                permissions
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async update(options = {}) {
        try {
            const { where, data } = options
            const { permissionIds, roleName, description } = data

            // Convert permissionIds to permissions format if provided
            const permissions = permissionIds
                ? permissionIds.map(permId => {
                    const [resource, action] = permId.split('.')
                    return `${resource}.${action}`
                })
                : undefined

            const result = await this.rolePermissionRepository.updateWithPermissions({
                where,
                roleData: {
                    ...(roleName && { name: roleName }),
                    ...(description !== undefined && { description })
                },
                permissions
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getResources() {
        try {
            return await this.rolePermissionRepository.getAvailableResources()
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = RolePermissionService
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
            const { permissions, ...roleData } = data

            const result = await this.rolePermissionRepository.createWithPermissions({
                roleData,
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
            const { permissions, ...roleData } = data

            const result = await this.rolePermissionRepository.updateWithPermissions({
                where,
                roleData,
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
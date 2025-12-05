const BaseService = require("../../shared/base/base.service")
const PasswordUtil = require("../../shared/utils/password.util")

class AdminService extends BaseService {
    constructor(adminRepository, logger) {
        super(adminRepository, logger)
        this.adminRepository = adminRepository
    }

    async findMany(options = {}) {
        try {
            const { page = 1, limit = 10, search, isActive, roleId } = options

            const result = await this.adminRepository.findManyWithPagination({
                page,
                limit,
                search,
                isActive,
                roleId
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async findUnique(options = {}) {
        try {
            const result = await this.adminRepository.findUniqueWithRoles(options)
            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async create(options = {}) {
        try {
            const { data } = options
            const { roleIds, password, ...adminData } = data

            // Hash password sebelum disimpan
            const hashedPassword = await PasswordUtil.hashPassword(password)

            const result = await this.adminRepository.createWithRoles({
                adminData: {
                    ...adminData,
                    password: hashedPassword
                },
                roleIds
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
            const { roleIds, ...adminData } = data

            const result = await this.adminRepository.updateWithRoles({
                where,
                adminData,
                roleIds
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = AdminService
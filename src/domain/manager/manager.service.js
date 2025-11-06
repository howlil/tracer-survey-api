const BaseService = require("../../shared/base/base.service")

class ManagerService extends BaseService {
    constructor(managerRepository, logger) {
        super(managerRepository, logger)
        this.managerRepository = managerRepository
    }

    async findMany(options = {}) {
        try {
            const { page = 1, limit = 10, search, company, position } = options

            const result = await this.managerRepository.findManyWithPagination({
                page,
                limit,
                search,
                company,
                position
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getCompanies() {
        try {
            return await this.managerRepository.getUniqueCompanies()
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getPositions() {
        try {
            return await this.managerRepository.getUniquePositions()
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = ManagerService
const BaseService = require("../../shared/base/base.service")

class FacultyService extends BaseService {
    constructor(facultyRepository, logger) {
        super(facultyRepository, logger)
        this.facultyRepository = facultyRepository
    }

    async findMany() {
        try {
            return await this.facultyRepository.findMany()
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = FacultyService
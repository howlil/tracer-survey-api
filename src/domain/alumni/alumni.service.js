const BaseService = require("../../shared/base/base.service")

class AlumniService extends BaseService {
    constructor(alumniRepository, logger) {
        super(alumniRepository, logger)
        this.alumniRepository = alumniRepository
    }

    async findMany(options = {}) {
        try {
            const { page = 1, limit = 10, search, facultyId, majorId, degree, graduatedYear, graduatePeriode } = options

            const result = await this.alumniRepository.findManyWithPagination({
                page,
                limit,
                search,
                facultyId,
                majorId,
                degree,
                graduatedYear,
                graduatePeriode
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = AlumniService
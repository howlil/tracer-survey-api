const BaseService = require("../../shared/base/base.service")

class MajorService extends BaseService {
    constructor(majorRepository, logger) {
        super(majorRepository, logger)
        this.majorRepository = majorRepository
    }

    async findMany(options = {}) {
        try {
            const { facultyId } = options
            const result = await this.majorRepository.findManyWithFaculty({
                facultyId
            })
            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = MajorService
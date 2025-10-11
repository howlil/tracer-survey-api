const BaseService = require("../../shared/base/base.service")

class FacultyService extends BaseService {
    constructor(facultyRepository, logger) {
        super(facultyRepository, logger)
        this.facultyRepository = facultyRepository
    }

    async facultyWithMajor() {
        try {
            return await this.facultyRepository.facultyWithMajor()

         

        } catch (error) {
            throw error
        }
    }
}

module.exports = FacultyService
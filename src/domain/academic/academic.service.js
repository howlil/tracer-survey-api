const BaseService = require("../../shared/base/base.service")

class AcademicService extends BaseService {
    constructor(academicRepository, logger) {
        super(academicRepository, logger)
        this.academicRepository = academicRepository
    }

  
}

module.exports = AcademicService
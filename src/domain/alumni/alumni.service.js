const BaseService = require("../../shared/base/base.service")

class AlumniService extends BaseService {
    constructor(alumniRepository, logger) {
        super(alumniRepository, logger)
        this.alumniRepository = alumniRepository
    }
}

module.exports = AlumniService
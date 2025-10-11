const BaseService = require("../../shared/base/base.service")

class MajorService extends BaseService {
    constructor(majorRepository, logger) {
        super(majorRepository, logger)
        this.majorRepository = majorRepository
    }
}

module.exports = MajorService
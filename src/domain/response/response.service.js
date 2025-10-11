const BaseService = require("../../shared/base/base.service")

class ResponseService extends BaseService {
    constructor(responseRepository, logger) {
        super(responseRepository, logger)  // ✅ Pass repository to parent
        this.responseRepository = responseRepository
    }

}

module.exports = ResponseService
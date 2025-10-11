const BaseController = require("../../shared/base/base.controller")

class ResponseController extends BaseController {
    constructor(responseService, logger) {
        super(responseService, logger)  // ✅ Pass service to parent
        this.responseService = responseService
        this.logger = logger
    }

}

module.exports = ResponseController
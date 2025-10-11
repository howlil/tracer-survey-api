const BaseController = require("../../shared/base/base.controller")

class MajorController extends BaseController {
    constructor(majorService, logger) {
        super(majorService, logger)
        this.majorService = majorService
        this.logger = logger
    }
}

module.exports = MajorController
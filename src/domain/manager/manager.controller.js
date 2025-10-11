const BaseController = require("../../shared/base/base.controller")

class ManagerController extends BaseController {
    constructor(managerService, logger) {
        super(managerService, logger)
        this.managerService = managerService
        this.logger = logger
    }
}

module.exports = ManagerController
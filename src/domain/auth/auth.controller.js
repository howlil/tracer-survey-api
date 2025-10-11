const BaseController = require("../../shared/base/base.controller")

class AdminController extends BaseController {
    constructor(adminService, logger) {
        super(adminService, logger)
        this.adminService = adminService
        this.logger = logger
    }
}

module.exports = AdminController
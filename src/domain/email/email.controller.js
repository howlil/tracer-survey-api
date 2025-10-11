const BaseController = require("../../shared/base/base.controller")

class EmailController extends BaseController {
    constructor(emailService, logger) {
        super(emailService, logger)  // ✅ Pass service to parent
        this.emailService = emailService
        this.logger = logger
    }

}

module.exports = EmailController
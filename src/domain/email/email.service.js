const BaseService = require("../../shared/base/base.service")

class EmailService extends BaseService {
    constructor(emailRepository, logger) {
        super(emailRepository, logger)  // ✅ Pass repository to parent
        this.emailRepository = emailRepository
    }

}

module.exports = EmailService
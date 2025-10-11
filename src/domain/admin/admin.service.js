const BaseService = require("../../shared/base/base.service")

class AdminService extends BaseService {
    constructor(adminRepository, logger) {
        super(adminRepository, logger)
        this.adminRepository = adminRepository
    }
}

module.exports = AdminService
const BaseService = require("../../shared/base/base.service")

class ManagerService extends BaseService {
    constructor(managerRepository, logger) {
        super(managerRepository, logger)
        this.managerRepository = managerRepository
    }
}

module.exports = ManagerService
const BaseService = require("../../shared/base/base.service")

class UserService extends BaseService {
    constructor(userRepository, logger) {
        super(userRepository, logger)  // ✅ Pass repository to parent
        this.userRepository = userRepository
    }

}

module.exports = UserService
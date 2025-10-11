const BaseController = require("../../shared/base/base.controller")

class UserController extends BaseController {
    constructor(userService, logger) {
        super(userService, logger)  // ✅ Pass service to parent
        this.userService = userService
        this.logger = logger
    }

}

module.exports = UserController
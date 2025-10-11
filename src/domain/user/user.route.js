const BaseRoute = require("../../shared/base/base.route")
const userController = require("./user.controller")

class UserRoute extends BaseRoute {
    constructor() {
        super(userController)  // ✅ Pass controller to parent
    }

    static getInstance() {
        if (!UserRoute.instance) {
            UserRoute.instance = new UserRoute()
        }
        return UserRoute.instance
    }

    createRoute() {
  
    }
}

module.exports = UserRoute.getInstance().getRouter()
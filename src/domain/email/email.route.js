const BaseRoute = require("../../shared/base/base.route")
const emailController = require("./email.controller")

class EmailRoute extends BaseRoute {
    constructor() {
        super(emailController)  // ✅ Pass controller to parent
    }

    static getInstance() {
        if (!EmailRoute.instance) {
            EmailRoute.instance = new EmailRoute()
        }
        return EmailRoute.instance
    }

    createRoute() {
  
    }
}

module.exports = EmailRoute.getInstance().getRouter()
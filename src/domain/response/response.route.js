const BaseRoute = require("../../shared/base/base.route")
const responseController = require("./response.controller")

class ResponseRoute extends BaseRoute {
    constructor() {
        super(responseController)  // ✅ Pass controller to parent
    }

    static getInstance() {
        if (!ResponseRoute.instance) {
            ResponseRoute.instance = new ResponseRoute()
        }
        return ResponseRoute.instance
    }

    createRoute() {
  
    }
}

module.exports = ResponseRoute.getInstance().getRouter()
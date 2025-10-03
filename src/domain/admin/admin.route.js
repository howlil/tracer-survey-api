const BaseRoute = require("../../shared/base/base.route")
const AdminValidation = require("./admin.validation")
const validationMiddleware = require("../../shared/middlewares/validation.middleware")


class AdminRoute extends BaseRoute {
    constructor(){
        super('adminController')
    }

    static getInstance(){
        if(!AdminRoute.instance) {
            AdminRoute.instance = new AdminRoute()
        }

        return AdminRoute.instance
    }

    createRoute() {
        this.
        get(
            "/v1/admin",
            "getAllAdmins"
        )
    }
}

module.exports = AdminRoute.getInstance().getRouter()
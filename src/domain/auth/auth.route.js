const BaseRoute = require("../../shared/base/base.route")
const adminController = require("./admin.controller")

class AdminRoute extends BaseRoute {
    constructor() {
        super(adminController)
    }

    static getInstance() {
        if (!AdminRoute.instance) {
            AdminRoute.instance = new AdminRoute()
        }
        return AdminRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/admins",
            "findMany"
        )

        this.post(
            "/v1/admin",
            "create"
        )

        this.patch(
            "/v1/admin/:id",
            "update"
        )

        this.delete(
            "/v1/admin/:id",
            "delete"
        )


    }
}

module.exports = AdminRoute.getInstance().getRouter()
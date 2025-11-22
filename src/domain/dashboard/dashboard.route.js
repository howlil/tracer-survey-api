const BaseRoute = require("../../shared/base/base.route")
const dashboardController = require("./dashboard.controller")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

class DashboardRoute extends BaseRoute {
    constructor() {
        super(dashboardController)
    }

    static getInstance() {
        if (!DashboardRoute.instance) {
            DashboardRoute.instance = new DashboardRoute()
        }
        return DashboardRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/dashboard/overview",
            "getOverview",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission("response.read")
        )
    }
}

module.exports = DashboardRoute.getInstance().getRouter()



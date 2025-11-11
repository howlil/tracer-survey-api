const BaseRoute = require("../../shared/base/base.route")
const managerController = require("./manager.controller")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

class ManagerRoute extends BaseRoute {
    constructor() {
        super(managerController)
    }

    static getInstance() {
        if (!ManagerRoute.instance) {
            ManagerRoute.instance = new ManagerRoute()
        }
        return ManagerRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/managers",
            "findMany",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )

        this.get(
            "/v1/managers/companies",
            "getCompanies",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )

        this.get(
            "/v1/managers/positions",
            "getPositions",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )
    }
}

module.exports = ManagerRoute.getInstance().getRouter()
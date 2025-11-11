const BaseRoute = require("../../shared/base/base.route")
const majorController = require("./major.controller")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

class MajorRoute extends BaseRoute {
    constructor() {
        super(majorController)
    }

    static getInstance() {
        if (!MajorRoute.instance) {
            MajorRoute.instance = new MajorRoute()
        }
        return MajorRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/majors",
            "findMany",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('major.manage')
        )
    }
}

module.exports = MajorRoute.getInstance().getRouter()
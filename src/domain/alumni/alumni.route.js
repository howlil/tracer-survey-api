const BaseRoute = require("../../shared/base/base.route")
const alumniController = require("./alumni.controller")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

class AlumniRoute extends BaseRoute {
    constructor() {
        super(alumniController)
    }

    static getInstance() {
        if (!AlumniRoute.instance) {
            AlumniRoute.instance = new AlumniRoute()
        }
        return AlumniRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/alumni",
            "findMany",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )
    }
}

module.exports = AlumniRoute.getInstance().getRouter()
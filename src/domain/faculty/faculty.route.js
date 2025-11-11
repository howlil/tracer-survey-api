const BaseRoute = require("../../shared/base/base.route")
const facultyController = require("./faculty.controller")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

class FacultyRoute extends BaseRoute {
    constructor() {
        super(facultyController)
    }

    static getInstance() {
        if (!FacultyRoute.instance) {
            FacultyRoute.instance = new FacultyRoute()
        }
        return FacultyRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/faculties",
            "findMany",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('faculty.manage')
        )
    }
}

module.exports = FacultyRoute.getInstance().getRouter()
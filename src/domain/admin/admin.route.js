const BaseRoute = require("../../shared/base/base.route")
const adminController = require("./admin.controller")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

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
            "findMany",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('admin.read')
        )

        this.get(
            "/v1/admins/:id",
            "findUnique",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('admin.read')
        )

        this.post(
            "/v1/admins",
            "create",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('admin.create'),
            this.validation.validateBody(require("./admin.validation").createSchema())
        )

        this.patch(
            "/v1/admins/:id",
            "update",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('admin.update'),
            this.validation.validateBody(require("./admin.validation").updateSchema())
        )

        this.delete(
            "/v1/admins/:id",
            "delete",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('admin.delete')
        )
    }
}

module.exports = AdminRoute.getInstance().getRouter()
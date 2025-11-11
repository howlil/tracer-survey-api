const BaseRoute = require("../../shared/base/base.route")
const rolePermissionController = require("./rolePermission.controller")
const rolePermissionValidation = require("./rolePermission.validation")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

class RolePermissionRoute extends BaseRoute {
    constructor() {
        super(rolePermissionController)
    }

    static getInstance() {
        if (!RolePermissionRoute.instance) {
            RolePermissionRoute.instance = new RolePermissionRoute()
        }
        return RolePermissionRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/roles",
            "findMany",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('role.read')
        )

        this.get(
            "/v1/roles/:id",
            "findUnique",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('role.read')
        )

        this.get(
            "/v1/roles/resources",
            "getResources",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('role.read')
        )

        this.post(
            "/v1/roles",
            "create",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('role.create'),
            this.validation.validateBody(rolePermissionValidation.createSchema())
        )

        this.patch(
            "/v1/roles/:id",
            "update",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('role.update'),
            this.validation.validateBody(rolePermissionValidation.updateSchema())
        )

        this.delete(
            "/v1/roles/:id",
            "delete",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('role.delete')
        )
    }
}

module.exports = RolePermissionRoute.getInstance().getRouter()
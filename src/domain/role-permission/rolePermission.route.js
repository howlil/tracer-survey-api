const BaseRoute = require("../../shared/base/base.route")
const rolePermissionController = require("./rolePermission.controller")
const rolePermissionValidation = require("./rolePermission.validation")


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
            "/v1/permissions",
            "permissions"
        )

        this.get(
            "/v1/roles",
            "findMany"
        )

        this.get(
            "/v1/roles/permission",
            "rolePermissions"
        )

        this.post(
            "/v1/role",
            "create",
            this.validation.validateBody(rolePermissionValidation.createSchema())
        )

        this.patch(
            "/v1/role/:id",
            "update",
            this.validation.validateBody(rolePermissionValidation.updateSchema())

        )

        this.delete(
            "/v1/role/:id",
            "delete"
        )
    }
}

module.exports = RolePermissionRoute.getInstance().getRouter()
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
        this.get("/v1/admins", "findMany")
        this.get("/v1/admins/:id", "findUnique")
        this.post("/v1/admins", "create", this.validation.validateBody(require("./admin.validation").createSchema()))
        this.patch("/v1/admins/:id", "update", this.validation.validateBody(require("./admin.validation").updateSchema()))
        this.delete("/v1/admins/:id", "delete")
    }
}

module.exports = AdminRoute.getInstance().getRouter()
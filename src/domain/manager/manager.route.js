const BaseRoute = require("../../shared/base/base.route")
const managerController = require("./manager.controller")

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
        this.get("/v1/managers", "findMany")
        this.get("/v1/manager/:id", "findUnique")
        this.post("/v1/manager", "create")
        this.patch("/v1/manager/:id", "update")
        this.delete("/v1/manager/:id", "delete")
    }
}

module.exports = ManagerRoute.getInstance().getRouter()
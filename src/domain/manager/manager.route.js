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
        this.get("/v1/managers/companies", "getCompanies")
        this.get("/v1/managers/positions", "getPositions")
    }
}

module.exports = ManagerRoute.getInstance().getRouter()
const BaseRoute = require("../../shared/base/base.route")
const majorController = require("./major.controller")

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
        this.get("/v1/majors", "findMany")
        this.post("/v1/major", "create")
        this.patch("/v1/major/:id", "update")
        this.delete("/v1/major/:id", "delete")
    }
}

module.exports = MajorRoute.getInstance().getRouter()
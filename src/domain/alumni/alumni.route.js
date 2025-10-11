const BaseRoute = require("../../shared/base/base.route")
const alumniController = require("./alumni.controller")

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
        this.get("/v1/alumnis", "findMany")
        this.get("/v1/alumni/:id", "findUnique")
        this.post("/v1/alumni", "create")
        this.patch("/v1/alumni/:id", "update")
        this.delete("/v1/alumni/:id", "delete")
    }
}

module.exports = AlumniRoute.getInstance().getRouter()
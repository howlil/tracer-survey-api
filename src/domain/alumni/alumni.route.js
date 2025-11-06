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
        this.get("/v1/alumni", "findMany")
    }
}

module.exports = AlumniRoute.getInstance().getRouter()
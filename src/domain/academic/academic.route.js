const BaseRoute = require("../../shared/base/base.route")
const academicController = require("./academic.controller")

class AcademicRoute extends BaseRoute {
    constructor() {
        super(academicController)
    }

    static getInstance() {
        if (!AcademicRoute.instance) {
            AcademicRoute.instance = new AcademicRoute()
        }
        return AcademicRoute.instance
    }

    createRoute() {

    }
}

module.exports = AcademicRoute.getInstance().getRouter()
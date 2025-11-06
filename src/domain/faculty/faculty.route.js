const BaseRoute = require("../../shared/base/base.route")
const facultyController = require("./faculty.controller")

class FacultyRoute extends BaseRoute {
    constructor() {
        super(facultyController)
    }

    static getInstance() {
        if (!FacultyRoute.instance) {
            FacultyRoute.instance = new FacultyRoute()
        }
        return FacultyRoute.instance
    }

    createRoute() {
        this.get("/v1/faculties", "findMany")
    }
}

module.exports = FacultyRoute.getInstance().getRouter()
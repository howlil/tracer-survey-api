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
        this.get("/v1/faculty/major", "facultyWithMajor")
        this.post("/v1/faculty", "create")
        this.patch("/v1/faculty/:id", "update")
        this.delete("/v1/faculty/:id", "delete")
    }
}

module.exports = FacultyRoute.getInstance().getRouter()
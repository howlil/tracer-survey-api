const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class FacultyController extends BaseController {
    constructor(facultyService, logger) {
        super(facultyService, logger)
        this.facultyService = facultyService
        this.logger = logger
    }

    async facultyWithMajor(req, res, next) {
        try {
            const response = await this.facultyService.facultyWithMajor()

            return ResponseFactory.get(response).send(res)

        } catch (error) {
            next(error)
        }
    }
}

module.exports = FacultyController
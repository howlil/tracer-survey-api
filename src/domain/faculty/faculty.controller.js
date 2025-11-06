const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class FacultyController extends BaseController {
    constructor(facultyService, logger) {
        super(facultyService, logger)
        this.facultyService = facultyService
        this.logger = logger
    }

    async findMany(req, res, next) {
        try {
            const result = await this.facultyService.findMany()
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = FacultyController
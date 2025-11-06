const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class AlumniController extends BaseController {
    constructor(alumniService, logger) {
        super(alumniService, logger)
        this.alumniService = alumniService
        this.logger = logger
    }

    async findMany(req, res, next) {
        try {
            const { page, limit, search, facultyId, majorId, degree, graduatedYear, graduatePeriode } = req.extract.getQuery([
                "page", "limit", "search", "facultyId", "majorId", "degree", "graduatedYear", "graduatePeriode"
            ])

            const result = await this.alumniService.findMany({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                facultyId,
                majorId,
                degree,
                graduatedYear: graduatedYear ? parseInt(graduatedYear) : undefined,
                graduatePeriode
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = AlumniController
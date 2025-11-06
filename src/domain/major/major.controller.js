const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class MajorController extends BaseController {
    constructor(majorService, logger) {
        super(majorService, logger)
        this.majorService = majorService
        this.logger = logger
    }

    async findMany(req, res, next) {
        try {
            const { facultyId } = req.extract.getQuery(["facultyId"])

            const result = await this.majorService.findMany({
                facultyId
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = MajorController
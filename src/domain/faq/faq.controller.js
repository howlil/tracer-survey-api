const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class FaqController extends BaseController {
    constructor(faqService, logger) {
        super(faqService, logger)
        this.faqService = faqService
        this.logger = logger
    }

    async findManyPublic(req, res, next) {
        try {
            const result = await this.faqService.findMany()
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = FaqController
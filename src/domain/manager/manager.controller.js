const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class ManagerController extends BaseController {
    constructor(managerService, logger) {
        super(managerService, logger)
        this.managerService = managerService
        this.logger = logger
    }

    async findMany(req, res, next) {
        try {
            const { page, limit, search, company, position } = req.extract.getQuery([
                "page", "limit", "search", "company", "position"
            ])

            const result = await this.managerService.findMany({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                company,
                position
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getCompanies(req, res, next) {
        try {
            const result = await this.managerService.getCompanies()
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getPositions(req, res, next) {
        try {
            const result = await this.managerService.getPositions()
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = ManagerController
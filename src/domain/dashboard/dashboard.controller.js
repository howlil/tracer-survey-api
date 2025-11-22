const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class DashboardController extends BaseController {
    constructor(dashboardService, logger) {
        super(dashboardService, logger)
        this.dashboardService = dashboardService
        this.logger = logger
    }

    async getOverview(req, res, next) {
        try {
            const result = await this.dashboardService.getOverview()
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = DashboardController



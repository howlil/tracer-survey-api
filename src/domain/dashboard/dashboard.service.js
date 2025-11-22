const BaseService = require("../../shared/base/base.service")

class DashboardService extends BaseService {
    constructor(dashboardRepository, logger) {
        super(dashboardRepository, logger)
        this.dashboardRepository = dashboardRepository
    }

    async getOverview() {
        try {
            const data = await this.dashboardRepository.getOverview()
            const recentActivities = await this.dashboardRepository.getRecentActivities(10)

            return {
                ...data,
                recentActivities
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = DashboardService



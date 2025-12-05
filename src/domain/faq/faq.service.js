const BaseService = require("../../shared/base/base.service")

class FaqService extends BaseService {
    constructor(faqRepository, logger) {
        super(faqRepository, logger)
        this.faqRepository = faqRepository
    }

    async findMany() {
        try {
            return await this.faqRepository.findMany()
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = FaqService
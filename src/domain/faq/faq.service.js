const BaseService = require("../../shared/base/base.service")

class FaqService extends BaseService {
    constructor(faqRepository, logger) {
        super(faqRepository, logger)
        this.faqRepository = faqRepository
    }
}

module.exports = FaqService
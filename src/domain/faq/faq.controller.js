const BaseController = require("../../shared/base/base.controller")

class FaqController extends BaseController {
    constructor(faqService, logger) {
        super(faqService, logger)
        this.faqService = faqService
        this.logger = logger
    }
}

module.exports = FaqController
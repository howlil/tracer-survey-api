const BaseController = require("../../shared/base/base.controller")

class QuestionController extends BaseController {
    constructor(questionService, logger) {
        super(questionService, logger)  // ✅ Pass service to parent
        this.questionService = questionService
        this.logger = logger
    }

}

module.exports = QuestionController
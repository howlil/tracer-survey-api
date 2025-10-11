const BaseService = require("../../shared/base/base.service")

class QuestionService extends BaseService {
    constructor(questionRepository, logger) {
        super(questionRepository, logger)  // ✅ Pass repository to parent
        this.questionRepository = questionRepository
    }

}

module.exports = QuestionService
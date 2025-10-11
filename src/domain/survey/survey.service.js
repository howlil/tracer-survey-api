const BaseService = require("../../shared/base/base.service")

class SurveyService extends BaseService {
    constructor(surveyRepository, logger) {
        super(surveyRepository, logger)  // ✅ Pass repository to parent
        this.surveyRepository = surveyRepository
    }

}

module.exports = SurveyService
const BaseController = require("../../shared/base/base.controller")

class SurveyController extends BaseController {
    constructor(surveyService, logger) {
        super(surveyService, logger)  // ✅ Pass service to parent
        this.surveyService = surveyService
        this.logger = logger
    }

}

module.exports = SurveyController
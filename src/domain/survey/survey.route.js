const BaseRoute = require("../../shared/base/base.route")
const surveyController = require("./survey.controller")

class SurveyRoute extends BaseRoute {
    constructor() {
        super(surveyController)  // ✅ Pass controller to parent
    }

    static getInstance() {
        if (!SurveyRoute.instance) {
            SurveyRoute.instance = new SurveyRoute()
        }
        return SurveyRoute.instance
    }

    createRoute() {
  
    }
}

module.exports = SurveyRoute.getInstance().getRouter()
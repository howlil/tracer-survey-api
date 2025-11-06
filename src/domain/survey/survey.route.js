const BaseRoute = require("../../shared/base/base.route")
const surveyController = require("./survey.controller")
const surveyValidation = require("./survey.validation")

class SurveyRoute extends BaseRoute {
    constructor() {
        super(surveyController)
    }

    static getInstance() {
        if (!SurveyRoute.instance) {
            SurveyRoute.instance = new SurveyRoute()
        }
        return SurveyRoute.instance
    }

    createRoute() {
        // Survey Management
        this.get("/v1/surveys", "getSurveys")
        this.get("/v1/surveys/:id", "getSurveyById")
        this.post("/v1/surveys", "createSurvey", this.validation.validateBody(surveyValidation.createSchema()))
        this.patch("/v1/surveys/:id", "updateSurvey", this.validation.validateBody(surveyValidation.updateSchema()))
        this.delete("/v1/surveys/:id", "deleteSurvey")

        // Survey Rules Management
        this.get("/v1/surveys/:surveyId/rules", "getSurveyRules")
        this.post("/v1/surveys/:surveyId/rules", "createSurveyRule", this.validation.validateBody(surveyValidation.createRuleSchema()))
        this.patch("/v1/surveys/:surveyId/rules/:id", "updateSurveyRule", this.validation.validateBody(surveyValidation.updateRuleSchema()))
        this.delete("/v1/surveys/:surveyId/rules/:id", "deleteSurveyRule")

        // Survey Questions Management
        this.get("/v1/surveys/:surveyId/questions", "getSurveyQuestions")
        this.post("/v1/surveys/:surveyId/code-questions", "createCodeQuestion", this.validation.validateBody(surveyValidation.createCodeQuestionSchema()))
        this.patch("/v1/surveys/:surveyId/questions/:id", "updateQuestion", this.validation.validateBody(surveyValidation.updateQuestionSchema()))
        this.delete("/v1/surveys/:surveyId/questions/:id", "deleteQuestion")
        this.patch("/v1/surveys/:surveyId/questions/reorder", "reorderQuestions", this.validation.validateBody(surveyValidation.reorderQuestionsSchema()))
        this.post("/v1/surveys/:surveyId/builder/save", "saveBuilder", this.validation.validateBody(surveyValidation.saveBuilderSchema()))
    }
}

module.exports = SurveyRoute.getInstance().getRouter()


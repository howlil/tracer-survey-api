const BaseRoute = require("../../shared/base/base.route")
const surveyController = require("./survey.controller")
const surveyValidation = require("./survey.validation")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

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
        // Public endpoints for published surveys (no authentication required)
        this.get(
            "/v1/public/surveys",
            "getPublishedSurveys"
        )

        this.get(
            "/v1/public/surveys/:id",
            "getPublishedSurveyById"
        )

        this.get(
            "/v1/public/surveys/:surveyId/questions",
            "getPublishedSurveyQuestions"
        )

        // Admin endpoints (require authentication)
        this.get(
            "/v1/surveys",
            "getSurveys",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('survey.read')
        )

        this.get(
            "/v1/surveys/:id",
            "getSurveyById",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('survey.read')
        )

        this.post(
            "/v1/surveys",
            "createSurvey",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('survey.create'),
            this.validation.validateBody(surveyValidation.createSchema())
        )

        this.patch(
            "/v1/surveys/:id",
            "updateSurvey",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('survey.update'),
            this.validation.validateBody(surveyValidation.updateSchema())
        )

        this.delete(
            "/v1/surveys/:id",
            "deleteSurvey",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('survey.delete')
        )

        this.get(
            "/v1/surveys/:surveyId/rules",
            "getSurveyRules",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('survey.read')
        )

        this.post(
            "/v1/surveys/:surveyId/rules",
            "createSurveyRule",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('survey.update'),
            this.validation.validateBody(surveyValidation.createRuleSchema())
        )

        this.patch(
            "/v1/surveys/:surveyId/rules/:id",
            "updateSurveyRule",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('survey.update'),
            this.validation.validateBody(surveyValidation.updateRuleSchema())
        )

        this.delete(
            "/v1/surveys/:surveyId/rules/:id",
            "deleteSurveyRule",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('survey.update')
        )

        this.get(
            "/v1/surveys/:surveyId/questions",
            "getSurveyQuestions",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requireAnyPermission('survey.read', 'question.read')
        )

        this.post(
            "/v1/surveys/:surveyId/code-questions",
            "createCodeQuestion",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('question.create'),
            this.validation.validateBody(surveyValidation.createCodeQuestionSchema())
        )

        // IMPORTANT: More specific routes (code-questions) must come before general routes (questions)
        // This prevents route conflicts where Express might match the wrong route
        // DELETE code-questions route MUST be before questions routes
        this.delete(
            "/v1/surveys/:surveyId/code-questions/:codeId",
            "deleteCodeQuestion",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('question.delete')
        )

        this.patch(
            "/v1/surveys/:surveyId/questions/:id",
            "updateQuestion",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('question.update'),
            this.validation.validateBody(surveyValidation.updateQuestionSchema())
        )

        this.delete(
            "/v1/surveys/:surveyId/questions/:id",
            "deleteQuestion",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('question.delete')
        )

        this.patch(
            "/v1/surveys/:surveyId/questions/reorder",
            "reorderQuestions",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('question.update'),
            this.validation.validateBody(surveyValidation.reorderQuestionsSchema())
        )

        this.post(
            "/v1/surveys/:surveyId/builder/save",
            "saveBuilder",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requireAnyPermission('survey.update', 'question.create', 'question.update'),
            this.validation.validateBody(surveyValidation.saveBuilderSchema())
        )
    }
}

module.exports = SurveyRoute.getInstance().getRouter()


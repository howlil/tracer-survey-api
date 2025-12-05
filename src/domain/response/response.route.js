const BaseRoute = require("../../shared/base/base.route")
const responseController = require("./response.controller")
const responseValidation = require("./response.validation")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

class ResponseRoute extends BaseRoute {
    constructor() {
        super(responseController)
    }

    static getInstance() {
        if (!ResponseRoute.instance) {
            ResponseRoute.instance = new ResponseRoute()
        }
        return ResponseRoute.instance
    }

    createRoute() {
        // Specific routes must come before parameterized routes
        this.get(
            "/v1/responses/tracer-study/export",
            "exportTracerStudyResponses",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('response.export')
        )

        this.get(
            "/v1/responses/tracer-study",
            "getTracerStudyResponses",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('response.read')
        )

        this.get(
            "/v1/responses/tracer-study/:id",
            "getTracerStudyResponseDetail",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('response.read')
        )

        // Specific routes must come before parameterized routes
        this.get(
            "/v1/responses/user-survey/export",
            "exportUserSurveyResponses",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('response.export')
        )

        this.get(
            "/v1/responses/user-survey",
            "getUserSurveyResponses",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('response.read')
        )

        this.get(
            "/v1/responses/user-survey/:id",
            "getUserSurveyResponseDetail",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('response.read')
        )

        this.post(
            "/v1/responses/submit",
            "submitResponse",
            PermissionMiddleware.authenticate,
            this.validation.validateBody(responseValidation.submitResponseSchema())
        )

        this.post(
            "/v1/responses/draft",
            "saveDraft",
            PermissionMiddleware.authenticate,
            this.validation.validateBody(responseValidation.saveDraftSchema())
        )
    }
}

module.exports = ResponseRoute.getInstance().getRouter()


const BaseRoute = require("../../shared/base/base.route")
const responseController = require("./response.controller")
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

        this.get(
            "/v1/responses/tracer-study/export",
            "exportTracerStudyResponses",
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

        this.get(
            "/v1/responses/user-survey/export",
            "exportUserSurveyResponses",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('response.export')
        )
    }
}

module.exports = ResponseRoute.getInstance().getRouter()


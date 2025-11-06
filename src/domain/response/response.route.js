const BaseRoute = require("../../shared/base/base.route")
const responseController = require("./response.controller")

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
        // Tracer Study (Alumni) Responses
        this.get("/v1/responses/tracer-study", "getTracerStudyResponses")
        this.get("/v1/responses/tracer-study/:id", "getTracerStudyResponseDetail")
        this.get("/v1/responses/tracer-study/export", "exportTracerStudyResponses")

        // User Survey (Manager) Responses
        this.get("/v1/responses/user-survey", "getUserSurveyResponses")
        this.get("/v1/responses/user-survey/:id", "getUserSurveyResponseDetail")
        this.get("/v1/responses/user-survey/export", "exportUserSurveyResponses")
    }
}

module.exports = ResponseRoute.getInstance().getRouter()


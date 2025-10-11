const BaseRoute = require("../../shared/base/base.route")
const questionController = require("./question.controller")

class QuestionRoute extends BaseRoute {
    constructor() {
        super(questionController)  // ✅ Pass controller to parent
    }

    static getInstance() {
        if (!QuestionRoute.instance) {
            QuestionRoute.instance = new QuestionRoute()
        }
        return QuestionRoute.instance
    }

    createRoute() {
  
    }
}

module.exports = QuestionRoute.getInstance().getRouter()
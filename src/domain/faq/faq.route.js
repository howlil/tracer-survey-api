const BaseRoute = require("../../shared/base/base.route")
const faqController = require("./faq.controller")
const faqValidation = require("./faq.validation")

class FaqRoute extends BaseRoute {
    constructor() {
        super(faqController)
    }

    static getInstance() {
        if (!FaqRoute.instance) {
            FaqRoute.instance = new FaqRoute()
        }
        return FaqRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/faqs",
            "findMany"
        )

        this.post(
            "/v1/faq",
            "create",
            this.validation.validateBody(faqValidation.createSchema())
        )

        this.patch(
            "/v1/faq/:id",
            "update",
            this.validation.validateBody(faqValidation.updateSchema())
        )

        this.delete(
            "/v1/faq/:id",
            "delete"
        )
    }
}

module.exports = FaqRoute.getInstance().getRouter()
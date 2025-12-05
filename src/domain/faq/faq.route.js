const BaseRoute = require("../../shared/base/base.route")
const faqController = require("./faq.controller")
const faqValidation = require("./faq.validation")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

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
        // Public endpoint for FAQ page (no authentication required)
        this.get(
            "/v1/faqs/public",
            "findManyPublic"
        )

        // Admin endpoint (requires authentication)
        this.get(
            "/v1/faqs",
            "findMany",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('faq.manage')
        )

        this.post(
            "/v1/faq",
            "create",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('faq.manage'),
            this.validation.validateBody(faqValidation.createSchema())
        )

        this.patch(
            "/v1/faq/:id",
            "update",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('faq.manage'),
            this.validation.validateBody(faqValidation.updateSchema())
        )

        this.delete(
            "/v1/faq/:id",
            "delete",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('faq.manage')
        )
    }
}

module.exports = FaqRoute.getInstance().getRouter()
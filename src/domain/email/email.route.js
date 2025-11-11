const BaseRoute = require("../../shared/base/base.route")
const emailController = require("./email.controller")
const emailValidation = require("./email.validation")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")

class EmailRoute extends BaseRoute {
    constructor() {
        super(emailController)
    }

    static getInstance() {
        if (!EmailRoute.instance) {
            EmailRoute.instance = new EmailRoute()
        }
        return EmailRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/email-templates",
            "getEmailTemplates",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.template.manage')
        )

        this.get(
            "/v1/email-templates/:id",
            "getEmailTemplateById",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.template.manage')
        )

        this.post(
            "/v1/email-templates",
            "createEmailTemplate",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.template.manage'),
            this.validation.validateBody(emailValidation.createTemplateSchema())
        )

        this.patch(
            "/v1/email-templates/:id",
            "updateEmailTemplate",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.template.manage'),
            this.validation.validateBody(emailValidation.updateTemplateSchema())
        )

        this.delete(
            "/v1/email-templates/:id",
            "deleteEmailTemplate",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.template.manage')
        )

        this.get(
            "/v1/blast-emails",
            "getBlastEmails",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.read')
        )

        this.get(
            "/v1/blast-emails/:id",
            "getBlastEmailById",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.read')
        )

        this.post(
            "/v1/blast-emails",
            "createBlastEmail",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.create'),
            this.validation.validateBody(emailValidation.createBlastEmailSchema())
        )

        this.patch(
            "/v1/blast-emails/:id",
            "updateBlastEmail",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.update'),
            this.validation.validateBody(emailValidation.updateBlastEmailSchema())
        )

        this.delete(
            "/v1/blast-emails/:id",
            "deleteBlastEmail",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.delete')
        )

        this.post(
            "/v1/blast-emails/preview-count",
            "previewRecipientCount",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('email.read'),
            this.validation.validateBody(emailValidation.previewCountSchema())
        )
    }
}

module.exports = EmailRoute.getInstance().getRouter()


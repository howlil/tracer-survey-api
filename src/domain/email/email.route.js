const BaseRoute = require("../../shared/base/base.route")
const emailController = require("./email.controller")
const emailValidation = require("./email.validation")

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
        // Email Template Management
        this.get("/v1/email-templates", "getEmailTemplates")
        this.get("/v1/email-templates/:id", "getEmailTemplateById")
        this.post("/v1/email-templates", "createEmailTemplate", this.validation.validateBody(emailValidation.createTemplateSchema()))
        this.patch("/v1/email-templates/:id", "updateEmailTemplate", this.validation.validateBody(emailValidation.updateTemplateSchema()))
        this.delete("/v1/email-templates/:id", "deleteEmailTemplate")

        // Blast Email Management
        this.get("/v1/blast-emails", "getBlastEmails")
        this.get("/v1/blast-emails/:id", "getBlastEmailById")
        this.post("/v1/blast-emails", "createBlastEmail", this.validation.validateBody(emailValidation.createBlastEmailSchema()))
        this.patch("/v1/blast-emails/:id", "updateBlastEmail", this.validation.validateBody(emailValidation.updateBlastEmailSchema()))
        this.delete("/v1/blast-emails/:id", "deleteBlastEmail")
        this.post("/v1/blast-emails/preview-count", "previewRecipientCount", this.validation.validateBody(emailValidation.previewCountSchema()))
    }
}

module.exports = EmailRoute.getInstance().getRouter()


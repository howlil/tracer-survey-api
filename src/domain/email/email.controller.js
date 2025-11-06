const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class EmailController extends BaseController {
    constructor(emailService, logger) {
        super(emailService, logger)
        this.emailService = emailService
        this.logger = logger
    }

    async getEmailTemplates(req, res, next) {
        try {
            const { page, limit, search } = req.extract.getQuery(["page", "limit", "search"])

            const result = await this.emailService.getEmailTemplates({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getEmailTemplateById(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const result = await this.emailService.getEmailTemplateById(id)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async createEmailTemplate(req, res, next) {
        try {
            const data = req.extract.getBody()
            const result = await this.emailService.createEmailTemplate(data)
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async updateEmailTemplate(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const data = req.extract.getBody()
            const result = await this.emailService.updateEmailTemplate(id, data)
            return ResponseFactory.updated(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async deleteEmailTemplate(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            await this.emailService.deleteEmailTemplate(id)
            return ResponseFactory.deleted().send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getBlastEmails(req, res, next) {
        try {
            const { page, limit, search, status, emailType } = req.extract.getQuery([
                "page", "limit", "search", "status", "emailType"
            ])

            const result = await this.emailService.getBlastEmails({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                status,
                emailType
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getBlastEmailById(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const result = await this.emailService.getBlastEmailById(id)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async createBlastEmail(req, res, next) {
        try {
            const data = req.extract.getBody()
            const result = await this.emailService.createBlastEmail(data)
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async updateBlastEmail(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const data = req.extract.getBody()
            const result = await this.emailService.updateBlastEmail(id, data)
            return ResponseFactory.updated(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async deleteBlastEmail(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            await this.emailService.deleteBlastEmail(id)
            return ResponseFactory.deleted().send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async previewRecipientCount(req, res, next) {
        try {
            const { recipientType, recipientFilters } = req.extract.getBody()
            const result = await this.emailService.previewRecipientCount(recipientType, recipientFilters)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = EmailController


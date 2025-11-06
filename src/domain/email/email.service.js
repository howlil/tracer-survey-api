const BaseService = require("../../shared/base/base.service")

class EmailService extends BaseService {
    constructor(emailRepository, logger) {
        super(emailRepository, logger)
        this.emailRepository = emailRepository
    }

    async getEmailTemplates(options = {}) {
        try {
            return await this.emailRepository.getEmailTemplates(options)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getEmailTemplateById(id) {
        try {
            return await this.emailRepository.getEmailTemplateById(id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createEmailTemplate(data) {
        try {
            return await this.emailRepository.createEmailTemplate(data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateEmailTemplate(id, data) {
        try {
            return await this.emailRepository.updateEmailTemplate(id, data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async deleteEmailTemplate(id) {
        try {
            return await this.emailRepository.deleteEmailTemplate(id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getBlastEmails(options = {}) {
        try {
            return await this.emailRepository.getBlastEmails(options)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getBlastEmailById(id) {
        try {
            return await this.emailRepository.getBlastEmailById(id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createBlastEmail(data) {
        try {
            return await this.emailRepository.createBlastEmail(data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateBlastEmail(id, data) {
        try {
            return await this.emailRepository.updateBlastEmail(id, data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async deleteBlastEmail(id) {
        try {
            return await this.emailRepository.deleteBlastEmail(id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async previewRecipientCount(recipientType, recipientFilters) {
        try {
            return await this.emailRepository.previewRecipientCount(recipientType, recipientFilters)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = EmailService


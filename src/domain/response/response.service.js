const BaseService = require("../../shared/base/base.service")

class ResponseService extends BaseService {
    constructor(responseRepository, logger) {
        super(responseRepository, logger)
        this.responseRepository = responseRepository
    }

    async getTracerStudyResponses(options = {}) {
        try {
            return await this.responseRepository.getTracerStudyResponses(options)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getTracerStudyResponseDetail(id) {
        try {
            return await this.responseRepository.getTracerStudyResponseDetail(id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async exportTracerStudyResponses(options, res) {
        try {
            return await this.responseRepository.exportTracerStudyResponses(options, res)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getUserSurveyResponses(options = {}) {
        try {
            return await this.responseRepository.getUserSurveyResponses(options)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getUserSurveyResponseDetail(id) {
        try {
            return await this.responseRepository.getUserSurveyResponseDetail(id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async exportUserSurveyResponses(options, res) {
        try {
            return await this.responseRepository.exportUserSurveyResponses(options, res)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async submitResponse(data) {
        try {
            return await this.responseRepository.submitResponse(data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = ResponseService


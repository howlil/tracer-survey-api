const BaseService = require("../../shared/base/base.service")

class SurveyService extends BaseService {
    constructor(surveyRepository, logger) {
        super(surveyRepository, logger)
        this.surveyRepository = surveyRepository
    }

    async getSurveys(options = {}) {
        try {
            return await this.surveyRepository.getSurveys(options)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getSurveyById(id) {
        try {
            return await this.surveyRepository.getSurveyById(id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createSurvey(data) {
        try {
            return await this.surveyRepository.createSurvey(data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateSurvey(id, data) {
        try {
            return await this.surveyRepository.updateSurvey(id, data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async deleteSurvey(id) {
        try {
            return await this.surveyRepository.deleteSurvey(id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getSurveyRules(surveyId) {
        try {
            return await this.surveyRepository.getSurveyRules(surveyId)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createSurveyRule(surveyId, data) {
        try {
            return await this.surveyRepository.createSurveyRule(surveyId, data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateSurveyRule(surveyId, id, data) {
        try {
            return await this.surveyRepository.updateSurveyRule(surveyId, id, data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async deleteSurveyRule(surveyId, id) {
        try {
            return await this.surveyRepository.deleteSurveyRule(surveyId, id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getSurveyQuestions(surveyId, codeId = null) {
        try {
            return await this.surveyRepository.getSurveyQuestions(surveyId, codeId)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createCodeQuestion(surveyId, data) {
        try {
            return await this.surveyRepository.createCodeQuestion(surveyId, data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateQuestion(surveyId, id, data) {
        try {
            return await this.surveyRepository.updateQuestion(surveyId, id, data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async deleteQuestion(surveyId, id) {
        try {
            return await this.surveyRepository.deleteQuestion(surveyId, id)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async reorderQuestions(surveyId, questionOrders) {
        try {
            return await this.surveyRepository.reorderQuestions(surveyId, questionOrders)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async saveBuilder(surveyId, data) {
        try {
            return await this.surveyRepository.saveBuilder(surveyId, data)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = SurveyService


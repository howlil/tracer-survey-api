const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class SurveyController extends BaseController {
    constructor(surveyService, logger) {
        super(surveyService, logger)
        this.surveyService = surveyService
        this.logger = logger
    }

    async getSurveys(req, res, next) {
        try {
            const { page, limit, search, status, targetRole } = req.extract.getQuery([
                "page", "limit", "search", "status", "targetRole"
            ])

            const result = await this.surveyService.getSurveys({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                status,
                targetRole
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getSurveyById(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const result = await this.surveyService.getSurveyById(id)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async createSurvey(req, res, next) {
        try {
            const data = req.extract.getBody()
            const result = await this.surveyService.createSurvey(data)
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async updateSurvey(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const data = req.extract.getBody()
            const result = await this.surveyService.updateSurvey(id, data)
            return ResponseFactory.updated(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async deleteSurvey(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            await this.surveyService.deleteSurvey(id)
            return ResponseFactory.deleted().send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getSurveyRules(req, res, next) {
        try {
            const { surveyId } = req.extract.getParams(["surveyId"])
            const result = await this.surveyService.getSurveyRules(surveyId)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async createSurveyRule(req, res, next) {
        try {
            const { surveyId } = req.extract.getParams(["surveyId"])
            const data = req.extract.getBody()
            const result = await this.surveyService.createSurveyRule(surveyId, data)
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async updateSurveyRule(req, res, next) {
        try {
            const { surveyId, id } = req.extract.getParams(["surveyId", "id"])
            const data = req.extract.getBody()
            const result = await this.surveyService.updateSurveyRule(surveyId, id, data)
            return ResponseFactory.updated(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async deleteSurveyRule(req, res, next) {
        try {
            const { surveyId, id } = req.extract.getParams(["surveyId", "id"])
            await this.surveyService.deleteSurveyRule(surveyId, id)
            return ResponseFactory.deleted().send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getSurveyQuestions(req, res, next) {
        try {
            const { surveyId } = req.extract.getParams(["surveyId"])
            const { codeId } = req.extract.getQuery(["codeId"])
            const result = await this.surveyService.getSurveyQuestions(surveyId, codeId)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async createCodeQuestion(req, res, next) {
        try {
            const { surveyId } = req.extract.getParams(["surveyId"])
            const data = req.extract.getBody()
            const result = await this.surveyService.createCodeQuestion(surveyId, data)
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async updateQuestion(req, res, next) {
        try {
            const { surveyId, id } = req.extract.getParams(["surveyId", "id"])
            const data = req.extract.getBody()
            const result = await this.surveyService.updateQuestion(surveyId, id, data)
            return ResponseFactory.updated(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async deleteQuestion(req, res, next) {
        try {
            const { surveyId, id } = req.extract.getParams(["surveyId", "id"])
            await this.surveyService.deleteQuestion(surveyId, id)
            return ResponseFactory.deleted().send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async reorderQuestions(req, res, next) {
        try {
            const { surveyId } = req.extract.getParams(["surveyId"])
            const { questionOrders } = req.extract.getBody()
            await this.surveyService.reorderQuestions(surveyId, questionOrders)
            return ResponseFactory.updated({ message: "Questions reordered successfully" }).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async deleteCodeQuestion(req, res, next) {
        try {
            const { surveyId, codeId } = req.extract.getParams(["surveyId", "codeId"])
            await this.surveyService.deleteCodeQuestion(surveyId, codeId)
            return ResponseFactory.deleted().send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async saveBuilder(req, res, next) {
        try {
            const { surveyId } = req.extract.getParams(["surveyId"])
            const data = req.extract.getBody()
            const result = await this.surveyService.saveBuilder(surveyId, data)
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = SurveyController


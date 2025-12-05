const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class ResponseController extends BaseController {
    constructor(responseService, logger) {
        super(responseService, logger)
        this.responseService = responseService
        this.logger = logger
    }

    async getTracerStudyResponses(req, res, next) {
        try {
            const { page, limit, search, facultyId, majorId, graduatedYear, graduatePeriode, degree } = req.extract.getQuery([
                "page", "limit", "search", "facultyId", "majorId", "graduatedYear", "graduatePeriode", "degree"
            ])

            const result = await this.responseService.getTracerStudyResponses({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                facultyId,
                majorId,
                graduatedYear: graduatedYear ? parseInt(graduatedYear) : undefined,
                graduatePeriode,
                degree
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getTracerStudyResponseDetail(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const result = await this.responseService.getTracerStudyResponseDetail(id)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async exportTracerStudyResponses(req, res, next) {
        try {
            this.logger.info('[exportTracerStudyResponses] Request received')
            this.logger.info('[exportTracerStudyResponses] req.url:', req.url)
            this.logger.info('[exportTracerStudyResponses] req.path:', req.path)
            this.logger.info('[exportTracerStudyResponses] req.params:', JSON.stringify(req.params))
            this.logger.info('[exportTracerStudyResponses] req.query:', JSON.stringify(req.query))
            
            const { format, search, facultyId, majorId, graduatedYear, graduatePeriode, degree, completionStatus } = req.extract.getQuery([
                "format", "search", "facultyId", "majorId", "graduatedYear", "graduatePeriode", "degree", "completionStatus"
            ])

            this.logger.info('[exportTracerStudyResponses] Extracted params:', JSON.stringify({
                format,
                search,
                facultyId,
                majorId,
                graduatedYear,
                graduatePeriode,
                degree,
                completionStatus
            }))

            const result = await this.responseService.exportTracerStudyResponses({
                format: format || "excel",
                search,
                facultyId,
                majorId,
                graduatedYear: graduatedYear ? parseInt(graduatedYear) : undefined,
                graduatePeriode,
                degree,
                completionStatus
            }, res)

            return result
        } catch (error) {
            this.logger.error('[exportTracerStudyResponses] Error:', error)
            this.logger.error('[exportTracerStudyResponses] Error message:', error.message)
            this.logger.error('[exportTracerStudyResponses] Error stack:', error.stack)
            if (error.response) {
                this.logger.error('[exportTracerStudyResponses] Error response:', JSON.stringify(error.response))
            }
            next(error)
        }
    }

    async getUserSurveyResponses(req, res, next) {
        try {
            const { page, limit, search, company, position } = req.extract.getQuery([
                "page", "limit", "search", "company", "position"
            ])

            const result = await this.responseService.getUserSurveyResponses({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                company,
                position
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async getUserSurveyResponseDetail(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const result = await this.responseService.getUserSurveyResponseDetail(id)
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async exportUserSurveyResponses(req, res, next) {
        try {
            const { format, search, company, position } = req.extract.getQuery([
                "format", "search", "company", "position"
            ])

            const result = await this.responseService.exportUserSurveyResponses({
                format: format || "excel",
                search,
                company,
                position
            }, res)

            return result
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async submitResponse(req, res, next) {
        try {
            const data = req.extract.getBody()
            const respondentId = req.userId // Get from authenticated user (set by PermissionMiddleware.authenticate)

            if (!respondentId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    error: { message: "User tidak terautentikasi" }
                })
            }

            const result = await this.responseService.submitResponse({
                ...data,
                respondentId
            })

            return ResponseFactory.created(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async saveDraft(req, res, next) {
        try {
            const data = req.validatedBody || req.extract.getBody()
            const respondentId = req.userId // Get from authenticated user (set by PermissionMiddleware.authenticate)

            this.logger.info('[saveDraft] Request data:', JSON.stringify({
                surveyId: data?.surveyId,
                answersCount: data?.answers?.length || 0,
                respondentId
            }))

            if (!respondentId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    error: { message: "User tidak terautentikasi" }
                })
            }

            const result = await this.responseService.saveDraft({
                ...data,
                respondentId
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error('[saveDraft] Error:', error)
            next(error)
        }
    }
}

module.exports = ResponseController


const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class AdminController extends BaseController {
    constructor(adminService, logger) {
        super(adminService, logger)
        this.adminService = adminService
        this.logger = logger
    }

    async findMany(req, res, next) {
        try {
            const { page, limit, search, isActive, roleId } = req.extract.getQuery([
                "page", "limit", "search", "isActive", "roleId"
            ])

            const result = await this.adminService.findMany({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search,
                isActive: isActive !== undefined ? isActive === 'true' : undefined,
                roleId
            })

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async findUnique(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const result = await this.adminService.findUnique({ where: { id } })
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async create(req, res, next) {
        try {
            const data = req.extract.getBody()
            const result = await this.adminService.create({ data })
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            next(error)
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const data = req.extract.getBody()
            const result = await this.adminService.update({ where: { id }, data })
            return ResponseFactory.updated(result).send(res)
        } catch (error) {
            next(error)
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            await this.adminService.delete(id)
            return ResponseFactory.deleted().send(res)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = AdminController
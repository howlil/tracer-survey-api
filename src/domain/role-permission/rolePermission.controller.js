const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class RolePermissionController extends BaseController {
    constructor(rolePermissionService, logger) {
        super(rolePermissionService, logger)
        this.rolePermissionService = rolePermissionService
        this.logger = logger
    }

    async findMany(req, res, next) {
        try {
            const { page, limit, search } = req.extract.getQuery(["page", "limit", "search"])

            const result = await this.rolePermissionService.findMany({
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

    async findUnique(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const result = await this.rolePermissionService.findUnique({ where: { id } })
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

    async create(req, res, next) {
        try {
            const data = req.extract.getBody()
            const result = await this.rolePermissionService.create({ data })
            return ResponseFactory.created(result).send(res)
        } catch (error) {
            next(error)
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            const data = req.extract.getBody()
            const result = await this.rolePermissionService.update({ where: { id }, data })
            return ResponseFactory.updated(result).send(res)
        } catch (error) {
            next(error)
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.extract.getParams(["id"])
            await this.rolePermissionService.delete(id)
            return ResponseFactory.deleted().send(res)
        } catch (error) {
            next(error)
        }
    }

    async getResources(req, res, next) {
        try {
            const result = await this.rolePermissionService.getResources()
            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }
}

module.exports = RolePermissionController
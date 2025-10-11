const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")

class RolePermissionController extends BaseController {
    constructor(rolePermissionService, logger) {
        super(rolePermissionService, logger)
        this.rolePermissionService = rolePermissionService
        this.logger = logger
    }

    
    async permissions (req, res, next) {
        try {
            const result = await this.rolePermissionService.permissions() 

            return ResponseFactory.get(result).send(res)

        } catch (error) {
            this.logger.error(error)    
            next(error)
        }
    }

    async rolePermissions (req,res,next) {
        try {
            const result = await this.rolePermissionService.rolePermissions()

            return ResponseFactory.get(result).send(res)
            
        } catch (error) {
            this.logger.error(error)
            next(error)
        }
    }

}

module.exports = RolePermissionController
const BaseRoute = require("../../shared/base/base.route")
const managerController = require("./manager.controller")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")
const ManagerValidation = require("./manager.validation")
const upload = require("../../shared/middlewares/upload.middleware")

class ManagerRoute extends BaseRoute {
    constructor() {
        super(managerController)
    }

    static getInstance() {
        if (!ManagerRoute.instance) {
            ManagerRoute.instance = new ManagerRoute()
        }
        return ManagerRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/managers",
            "findMany",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )

        this.get(
            "/v1/managers/companies",
            "getCompanies",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )

        this.get(
            "/v1/managers/positions",
            "getPositions",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )

        this.get(
            "/v1/managers/template",
            "downloadTemplate",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )

        this.post(
            "/v1/managers",
            "createManual",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.create'),
            this.validation.validateBody(ManagerValidation.createSchema())
        )

        this.post(
            "/v1/managers/import",
            "importExcel",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.import'),
            upload.single('file')
        )
    }
}

module.exports = ManagerRoute.getInstance().getRouter()
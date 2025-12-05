const BaseRoute = require("../../shared/base/base.route")
const alumniController = require("./alumni.controller")
const PermissionMiddleware = require("../../shared/middlewares/permission.middleware")
const AlumniValidation = require("./alumni.validation")
const upload = require("../../shared/middlewares/upload.middleware")

class AlumniRoute extends BaseRoute {
    constructor() {
        super(alumniController)
    }

    static getInstance() {
        if (!AlumniRoute.instance) {
            AlumniRoute.instance = new AlumniRoute()
        }
        return AlumniRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/alumni",
            "findMany",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )

        this.get(
            "/v1/alumni/template",
            "downloadTemplate",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.read')
        )

        this.post(
            "/v1/alumni",
            "createManual",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.create'),
            this.validation.validateBody(AlumniValidation.createSchema())
        )

        this.post(
            "/v1/alumni/import",
            "importExcel",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.import'),
            upload.single('file')
        )

        this.patch(
            "/v1/alumni/:id",
            "update",
            PermissionMiddleware.authenticate,
            PermissionMiddleware.requirePermission('respondent.update'),
            this.validation.validateBody(AlumniValidation.updateSchema())
        )

        this.get(
            "/v1/alumni/profile/me",
            "getCurrentProfile",
            PermissionMiddleware.authenticate
        )
    }
}

module.exports = AlumniRoute.getInstance().getRouter()
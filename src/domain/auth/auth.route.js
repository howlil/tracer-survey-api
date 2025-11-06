const BaseRoute = require("../../shared/base/base.route")
const authController = require("./auth.controller")
const authValidation = require("./auth.validation")

class AuthRoute extends BaseRoute {
    constructor() {
        super(authController)
    }

    static getInstance() {
        if (!AuthRoute.instance) {
            AuthRoute.instance = new AuthRoute()
        }
        return AuthRoute.instance
    }

    createRoute() {
        this.get(
            "/v1/auth/captcha",
            "generateCaptcha"
        )

        this.post(
            "/v1/auth/admin/login",
            "adminLogin",
            this.validation.validateBody(authValidation.adminLoginSchema())
        )

        this.post(
            "/v1/auth/alumni/login",
            "alumniLogin",
            this.validation.validateBody(authValidation.alumniLoginSchema())
        )

        this.post(
            "/v1/auth/manager/login",
            "managerLogin",
            this.validation.validateBody(authValidation.managerLoginSchema())
        )
    }
}

module.exports = AuthRoute.getInstance().getRouter()


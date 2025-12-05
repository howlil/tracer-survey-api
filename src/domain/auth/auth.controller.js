const BaseController = require("../../shared/base/base.controller")
const ResponseFactory = require("../../shared/factories/response-factory.http")
const CaptchaUtil = require("../../shared/utils/captcha.util")

class AuthController extends BaseController {
    constructor(authService, logger) {
        super(authService, logger)
        this.authService = authService
        this.logger = logger
    }

    async adminLogin(req, res, next) {
        try {
            const { email, password } = req.extract.getBody()

            const result = await this.authService.adminLogin(email, password)

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error('Error in adminLogin controller:', error)
            next(error)
        }
    }

    async alumniLogin(req, res, next) {
        try {
            const { pin, recaptchaToken } = req.extract.getBody()
            const remoteIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null

            // Validate Google reCAPTCHA
            const isValidCaptcha = await CaptchaUtil.validateRecaptcha(recaptchaToken, remoteIp)

            if (!isValidCaptcha) {
                return res.status(400).json({
                    status: 400,
                    message: 'reCAPTCHA tidak valid atau sudah kadaluarsa'
                })
            }

            const result = await this.authService.alumniLogin(pin)

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error('Error in alumniLogin controller:', error)
            next(error)
        }
    }

    async managerLogin(req, res, next) {
        try {
            const { pin, recaptchaToken } = req.extract.getBody()
            const remoteIp = req.ip || req.connection.remoteAddress || null

            // Validate Google reCAPTCHA
            const isValidCaptcha = await CaptchaUtil.validateRecaptcha(recaptchaToken, remoteIp)

            if (!isValidCaptcha) {
                return res.status(400).json({
                    status: 400,
                    message: 'reCAPTCHA tidak valid atau sudah kadaluarsa'
                })
            }

            const result = await this.authService.managerLogin(pin)

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error('Error in managerLogin controller:', error)
            next(error)
        }
    }

}

module.exports = AuthController

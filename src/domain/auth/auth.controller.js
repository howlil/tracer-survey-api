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
            const { pin, captcha, captchaId } = req.extract.getBody()

            // Validate captcha
            if (!captchaId || !captcha) {
                return res.status(400).json({
                    status: 400,
                    message: 'Captcha ID dan jawaban wajib diisi'
                })
            }

            const isValidCaptcha = CaptchaUtil.validateCaptcha(captchaId, captcha)

            if (!isValidCaptcha) {
                return res.status(400).json({
                    status: 400,
                    message: 'Captcha tidak valid atau sudah kadaluarsa'
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
            const { pin, captcha, captchaId } = req.extract.getBody()

            // Validate captcha
            if (!captchaId || !captcha) {
                return res.status(400).json({
                    status: 400,
                    message: 'Captcha ID dan jawaban wajib diisi'
                })
            }

            const isValidCaptcha = CaptchaUtil.validateCaptcha(captchaId, captcha)

            if (!isValidCaptcha) {
                return res.status(400).json({
                    status: 400,
                    message: 'Captcha tidak valid atau sudah kadaluarsa'
                })
            }

            const result = await this.authService.managerLogin(pin)

            return ResponseFactory.get(result).send(res)
        } catch (error) {
            this.logger.error('Error in managerLogin controller:', error)
            next(error)
        }
    }

    /**
     * Generate captcha untuk frontend
     */
    async generateCaptcha(req, res, next) {
        try {
            const { type = 'math' } = req.extract.getQuery(['type'])

            let captcha
            if (type === 'text') {
                captcha = CaptchaUtil.generateTextCaptcha()
            } else {
                captcha = CaptchaUtil.generateMathCaptcha()
            }

            return ResponseFactory.get(captcha).send(res)
        } catch (error) {
            this.logger.error('Error in generateCaptcha controller:', error)
            next(error)
        }
    }
}

module.exports = AuthController

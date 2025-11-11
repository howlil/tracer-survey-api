const joi = require('joi')

class AuthValidation {
    static adminLoginSchema() {
        return joi.object({
            email: joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Email tidak valid',
                    'any.required': 'Email wajib diisi'
                }),
            password: joi.string()
                .min(6)
                .required()
                .messages({
                    'string.min': 'Password minimal 6 karakter',
                    'any.required': 'Password wajib diisi'
                })
        })
    }

    static alumniLoginSchema() {
        return joi.object({
            pin: joi.string()
                .required()
                .messages({
                    'any.required': 'PIN wajib diisi'
                }),
            recaptchaToken: joi.string()
                .required()
                .messages({
                    'any.required': 'reCAPTCHA token wajib diisi'
                })
        })
    }

    static managerLoginSchema() {
        return joi.object({
            pin: joi.string()
                .required()
                .messages({
                    'any.required': 'PIN wajib diisi'
                }),
            recaptchaToken: joi.string()
                .required()
                .messages({
                    'any.required': 'reCAPTCHA token wajib diisi'
                })
        })
    }
}

module.exports = AuthValidation

